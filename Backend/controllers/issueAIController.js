import { generateEmbedding } from "../helpers/embeddings.js";
import {
  upsertIssueVector,
  searchSimilarIssues,
} from "../helpers/vectorStore.js";

const DUPLICATE_THRESHOLD = 0.75; // 75% similarity = warn user

/**
 * POST /issue/check-duplicate/:repoId
 * Called while user is TYPING — before they submit
 */
export const checkDuplicateIssue = async (req, res) => {
  const { repoId } = req.params;
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: "title and description required" });
  }

  try {
    // 1. Convert user's text to a vector
    const userText = `${title} ${description}`;
    const userEmbedding = await generateEmbedding(userText);

    if (!userEmbedding) {
      // AI failed — don't block issue creation, just skip check
      return res.status(200).json({
        isDuplicate: false,
        confidence: 0,
        similarIssues: [],
        warning: "AI check unavailable — proceed normally",
      });
    }

    // 2. Search Pinecone for similar issues in THIS repo's namespace
    const matches = await searchSimilarIssues(repoId, userEmbedding, 3);

    if (matches.length === 0) {
      return res.status(200).json({
        isDuplicate: false,
        confidence: 0,
        similarIssues: [],
      });
    }

    // 3. Shape the response
    const similarIssues = matches.map((match) => ({
      issueId: match.id,
      title: match.metadata?.title,
      description: match.metadata?.description,
      status: match.metadata?.status,
      similarity: Math.round(match.score * 100), // 87 (percentage)
    }));

    const topScore = matches[0].score;
    const isDuplicate = topScore >= DUPLICATE_THRESHOLD;

    return res.status(200).json({
      isDuplicate,
      confidence: Math.round(topScore * 100),
      similarIssues: isDuplicate ? similarIssues : [],
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Called AFTER issue is created in issueController.js
 * Fire and forget — don't await in the main controller
 */
export const embedAndIndexIssue = async (
  issueId,
  repoId,
  title,
  description,
) => {
  const text = `${title} ${description}`;
  const embedding = await generateEmbedding(text);
  if (!embedding) return;
  await upsertIssueVector(issueId, repoId, embedding, { title, description });
};
