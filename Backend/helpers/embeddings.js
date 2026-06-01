import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const EMBEDDING_DIMENSIONS = 768;

export async function generateEmbedding(text) {
  try {
    const model = client.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent({
      content: {
        parts: [{ text }],
      },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });
    const values = result.embedding.values;

    if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
      console.error(
        `Embedding failed: expected ${EMBEDDING_DIMENSIONS} dimensions, got ${values?.length ?? 0}`,
      );
      return null;
    }

    return values;
  } catch (error) {
    console.error("Embedding failed:", error.message);
    return null;
  }
}

/**
 * Weighted embedding — title repeated twice so model
 * pays 2x attention to it over description
 * Both search queries AND indexed issues must use this
 * same function so vectors live in the same space
 */
export async function generateWeightedEmbedding(title, description) {
  const weightedText = `${title}. ${title}. ${description}`;
  return generateEmbedding(weightedText);
}
