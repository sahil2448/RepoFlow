// Backend/helpers/ragVerdict.js
//
// The GENERATION half of the RAG pipeline.
//   - Retrieval (embeddings.js + vectorStore.js) returns the top-k similar issues.
//   - This module feeds those retrieved issues into a *generative* Gemini model
//     as grounding context, so the duplicate verdict + explanation is genuine
//     retrieval-augmented generation, not a bare similarity score.
//
// Design rules (mirrors helpers/embeddings.js):
//   - Never throws at import when GOOGLE_API_KEY is missing (CI/tests).
//   - Callers treat a failure here as "AI unavailable" and degrade gracefully.

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const client = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY ||
    // Same guard as embeddings.js: the constructor validates that the key is
    // *present*, not that it is valid. Production always supplies the real key
    // via .env.
    "repoflow-development-invalid-key",
);

// Model is configurable so it can be swapped without a code change.
// gemini-2.5-flash is a good cost/speed balance; -flash-lite is the budget pick.
const VERDICT_MODEL = process.env.GEMINI_VERDICT_MODEL || "gemini-2.5-flash";

function buildPrompt({ title, description, similarIssues }) {
  const context = similarIssues
    .map(
      (m) =>
        `- #${m.issueId} (${m.similarity}% similar): "${m.title}" — ${m.description ?? ""}`,
    )
    .join("\n");

  return [
    "You are a triage assistant for a GitHub-style issue tracker.",
    "A user is about to create a new issue.",
    "",
    `New issue title: ${title}`,
    `New issue description: ${description}`,
    "",
    "The following existing issues were retrieved by semantic search as the most",
    "likely duplicates:",
    "",
    context,
    "",
    "Decide whether the new issue is truly a duplicate of any of them.",
    "Judge meaning, not wording. If it describes a distinct problem, it is not a",
    "duplicate even when the words are similar.",
    "",
    'Answer with strict JSON only (no markdown, no code fences), exactly:',
    '{ "isDuplicate": true, "confidence": 85, "reason": "<1-2 sentence explanation>" }',
  ].join("\n");
}

/**
 * Runs the generative step of the RAG pipeline: given the candidate issue and
 * the retrieved similar issues (grounding context), asks Gemini to decide
 * whether the new issue is a duplicate and to explain why.
 *
 * @throws on Gemini/parse failures so the caller can fall back to a
 *         similarity-only response without blocking issue creation.
 */
export async function generateDuplicateVerdict({
  title,
  description,
  similarIssues,
}) {
  if (!Array.isArray(similarIssues) || similarIssues.length === 0) {
    return { isDuplicate: false, confidence: 0, reason: null };
  }

  const model = client.getGenerativeModel({ model: VERDICT_MODEL });
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt({ title, description, similarIssues }) }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      // Ask Gemini for strict JSON output so parsing is reliable.
      responseMimeType: "application/json",
    },
  });

  const raw = result.response.text();
  if (!raw || !raw.trim()) {
    throw new Error("Gemini returned an empty verdict");
  }

  const parsed = JSON.parse(raw);
  if (typeof parsed.isDuplicate !== "boolean") {
    throw new Error("Verdict missing required isDuplicate boolean");
  }

  const confidence = Math.max(
    0,
    Math.min(100, Math.round(Number(parsed.confidence) || 0)),
  );
  const reason = typeof parsed.reason === "string" ? parsed.reason.trim() : null;

  return { isDuplicate: parsed.isDuplicate, confidence, reason };
}