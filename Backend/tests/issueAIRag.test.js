// Backend/tests/issueAIRag.test.js
// Hermetic unit tests for the RAG duplicate-check pipeline. The three external
// AI helpers (Gemini embeddings, Pinecone retrieval, generative verdict) are
// mocked, so these run without keys or network in CI.
import { jest } from "@jest/globals";

jest.unstable_mockModule("../helpers/embeddings.js", () => ({
  generateWeightedEmbedding: jest.fn(),
}));

jest.unstable_mockModule("../helpers/vectorStore.js", () => ({
  upsertIssueVector: jest.fn(),
  searchSimilarIssues: jest.fn(),
}));

jest.unstable_mockModule("../helpers/ragVerdict.js", () => ({
  generateDuplicateVerdict: jest.fn(),
}));

const { checkDuplicateIssue } = await import(
  "../controllers/issueAIController.js"
);
const { generateWeightedEmbedding } = await import(
  "../helpers/embeddings.js"
);
const { searchSimilarIssues } = await import("../helpers/vectorStore.js");
const { generateDuplicateVerdict } = await import(
  "../helpers/ragVerdict.js"
);

const match = (overrides = {}) => ({
  id: "abc123",
  score: 0.9,
  metadata: {
    title: "App crashes on login for new users",
    description: "Logging in as a fresh user crashes the dashboard.",
    status: "open",
  },
  ...overrides,
});

function mockReq(body, repoId = "repo123") {
  return { params: { repoId }, body };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const validBody = {
  title: "Dashboard crashes during login",
  description:
    "A fresh user logging in for the first time gets a crash on dashboard load.",
};

beforeEach(() => {
  jest.clearAllMocks();
  generateWeightedEmbedding.mockResolvedValue(new Array(768).fill(0.1));
});

test("returns an empty no-duplicate shape without calling the generative step when retrieval finds nothing", async () => {
  searchSimilarIssues.mockResolvedValue([]);

  const res = mockRes();
  await checkDuplicateIssue(mockReq(validBody), res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      isDuplicate: false,
      confidence: 0,
      similarIssues: [],
    }),
  );
  expect(generateDuplicateVerdict).not.toHaveBeenCalled();
});

test("above-threshold candidates feed a generative verdict into the response", async () => {
  searchSimilarIssues.mockResolvedValue([match(), match({ score: 0.5 })]);
  generateDuplicateVerdict.mockResolvedValue({
    isDuplicate: true,
    confidence: 88,
    reason: "Looks like the same login crash already reported in #abc123.",
  });

  const res = mockRes();
  await checkDuplicateIssue(mockReq(validBody), res);

  expect(generateDuplicateVerdict).toHaveBeenCalledTimes(1);
  const [args] = generateDuplicateVerdict.mock.calls;
  expect(args[0].similarIssues).toHaveLength(1); // below-threshold match excluded
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      isDuplicate: true,
      confidence: 88,
      reason: "Looks like the same login crash already reported in #abc123.",
      similarIssues: [
        expect.objectContaining({ issueId: "abc123", similarity: 90 }),
      ],
    }),
  );
});

test("falls back to the similarity-only verdict when generation fails", async () => {
  searchSimilarIssues.mockResolvedValue([match()]);
  generateDuplicateVerdict.mockRejectedValue(new Error("Gemini down"));

  const res = mockRes();
  await checkDuplicateIssue(mockReq(validBody), res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      isDuplicate: true,
      confidence: 90, // from the Pinecone similarity score
      reason: null,
    }),
  );
});

test("keeps the retrieved candidates and reason when the LLM deems the issue distinct", async () => {
  searchSimilarIssues.mockResolvedValue([match()]);
  generateDuplicateVerdict.mockResolvedValue({
    isDuplicate: false,
    confidence: 40,
    reason: "Similar wording but a different problem domain.",
  });

  const res = mockRes();
  await checkDuplicateIssue(mockReq(validBody), res);

  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      isDuplicate: false,
      confidence: 40,
      reason: "Similar wording but a different problem domain.",
      similarIssues: expect.any(Array),
    }),
  );
});