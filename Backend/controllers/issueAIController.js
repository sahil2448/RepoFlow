import { createHash } from "node:crypto";
import { generateWeightedEmbedding } from "../helpers/embeddings.js";
import {
  upsertIssueVector,
  searchSimilarIssues,
} from "../helpers/vectorStore.js";
import { generateDuplicateVerdict } from "../helpers/ragVerdict.js";
import { cacheGet, cacheSet, cacheKeys } from "../helpers/cache.js";




const DUPLICATE_THRESHOLD = 0.82;


const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 20;

// Results are cached briefly because the RAG path adds a generative Gemini
// call, and the frontend fires one check per 600ms typing pause. Repeating the
// exact same (repo, text) pair within a window is served straight from cache.
const DUP_CHECK_CACHE_TTL = 300; // seconds

function duplicateCheckCacheKey(repoId, title, description) {
  const hash = createHash("sha1")
    .update(
      `${String(title).trim().toLowerCase()}|${String(description).trim().toLowerCase()}`,
    )
    .digest("hex");
  return cacheKeys.issueDupCheck(repoId, hash);
}

export const checkDuplicateIssue = async (req, res) => {
  const { repoId } = req.params;
  const { title, description } = req.body;

  
  if (
    !title?.trim() ||
    !description?.trim() ||
    title.trim().length < MIN_TITLE_LENGTH ||
    description.trim().length < MIN_DESCRIPTION_LENGTH
  ) {
    return res.status(200).json({
      isDuplicate: false,
      confidence: 0,
      similarIssues: [],
      reason: "not_enough_content",
    });
  }

  // Serve repeated checks of the same text from cache before paying for
  // embeddings and (potentially) a generative Gemini call.
  const cacheKey = duplicateCheckCacheKey(repoId, title, description);
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    
    const userEmbedding = await generateWeightedEmbedding(
      title.trim(),
      description.trim(),
    );

    if (!userEmbedding) {
      return res.status(200).json({
        isDuplicate: false,
        confidence: 0,
        similarIssues: [],
        warning: "AI unavailable — proceed normally",
      });
    }

    const matches = await searchSimilarIssues(repoId, userEmbedding, 3);

    if (matches.length === 0) {
      const empty = {
        isDuplicate: false,
        confidence: 0,
        similarIssues: [],
        reason: null,
      };
      await cacheSet(cacheKey, empty, DUP_CHECK_CACHE_TTL);
      return res.status(200).json(empty);
    }

    
    const relevantMatches = matches.filter(
      (m) => m.score >= DUPLICATE_THRESHOLD,
    );

    const similarIssues = relevantMatches.map((match) => ({
      issueId: match.id,
      title: match.metadata?.title,
      description: match.metadata?.description,
      status: match.metadata?.status,
      similarity: Math.round(match.score * 100),
    }));

    // Similarity-only baseline (what the endpoint returned before the RAG step).
    let payload = {
      isDuplicate: similarIssues.length > 0,
      confidence: similarIssues[0]?.similarity ?? 0,
      similarIssues,
      reason: null,
    };

    // RAG step: ground a generative Gemini verdict in the retrieved issues.
    if (similarIssues.length > 0) {
      try {
        const verdict = await generateDuplicateVerdict({
          title: title.trim(),
          description: description.trim(),
          similarIssues,
        });
        payload = {
          ...payload,
          isDuplicate: verdict.isDuplicate,
          confidence: verdict.confidence,
          reason: verdict.reason ?? null,
        };
      } catch (error) {
        console.error(
          "RAG verdict generation failed — falling back to similarity:",
          error.message,
        );
      }
    }

    await cacheSet(cacheKey, payload, DUP_CHECK_CACHE_TTL);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Duplicate check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const embedAndIndexIssue = async (
  issueId,
  repoId,
  title,
  description,
) => {
  try {
    
    
    const embedding = await generateWeightedEmbedding(title, description);
    if (!embedding) return;
    await upsertIssueVector(issueId, repoId, embedding, { title, description });
  } catch (err) {
    console.error("Embed and index failed:", err.message);
  }
};
