import { generateWeightedEmbedding } from "../helpers/embeddings.js";
import {
  upsertIssueVector,
  searchSimilarIssues,
} from "../helpers/vectorStore.js";




const DUPLICATE_THRESHOLD = 0.82;


const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 20;

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
      return res.status(200).json({
        isDuplicate: false,
        confidence: 0,
        similarIssues: [],
      });
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

    const isDuplicate = relevantMatches.length > 0;
    const confidence = relevantMatches[0]
      ? Math.round(relevantMatches[0].score * 100)
      : 0;

    return res.status(200).json({
      isDuplicate,
      confidence,
      similarIssues,
    });
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
