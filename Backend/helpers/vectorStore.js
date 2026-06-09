import { index } from "../config/pinecone-config.js";



export async function upsertIssueVector(issueId, repoId, embedding, metadata) {
  try {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error(
        `Invalid embedding for issue ${issueId}: empty or missing vector`,
      );
    }

    const record = {
      id: issueId.toString(),
      values: embedding,
      metadata: {
        title: metadata?.title ?? "",
        description: metadata?.description ?? "",
        status: metadata?.status ?? "open",
      },
    };

    await index.namespace(`repo-${repoId}`).upsert({
      records: [record],
    });
    console.log(`Issue ${issueId} indexed in Pinecone`);
  } catch (error) {
    console.error("Pinecone upsert failed:", error.message);
  }
}

export async function searchSimilarIssues(repoId, embedding, topK = 3) {
  try {
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return [];
    }

    const results = await index.namespace(`repo-${repoId}`).query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    return results.matches || [];
  } catch (error) {
    console.error("Pinecone query failed:", error.message);
    return [];
  }
}

export async function deleteIssueVector(issueId, repoId) {
  try {
    await index.namespace(`repo-${repoId}`).deleteOne(issueId.toString());
  } catch (error) {
    console.error("Pinecone delete failed:", error.message);
  }
}
