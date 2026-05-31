import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const EMBEDDING_DIMENSIONS = 768;

/**
 * Converts text into a 768-dimensional vector
 * This vector captures MEANING, not just keywords
 * "Login broken" and "Can't sign in" will have similar vectors
 */
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

    return values; // [0.23, -0.11, 0.87, ...] 768 numbers
  } catch (error) {
    console.error("Embedding failed:", error.message);
    return null;
  }
}
