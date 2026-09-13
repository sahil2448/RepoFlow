// Backend/tests/jest-rag-only.config.js
// Lightweight config used to run ONLY the hermetic RAG duplicate-check tests.
// These mock every external helper (embeddings, Pinecone, generative verdict),
// so they do not need the in-memory MongoDB global setup from jest.config.js.
export default {
  rootDir: "../", // repo root = Backend/
  testEnvironment: "node",
  maxWorkers: 1,
  testMatch: ["**/tests/issueAIRag.test.js"],
  setupFiles: ["<rootDir>/tests/jest-setup-env.js"],
  transform: {},
  verbose: true,
};