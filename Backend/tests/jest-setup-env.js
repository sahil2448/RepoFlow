// Backend/tests/jest-setup-env.js
// Injects test config before any controller/routes module is imported.
import fs from "fs";
import os from "os";
import path from "path";

const ENV_FILE = path.join(os.tmpdir(), "repoflow-test-env.json");
if (fs.existsSync(ENV_FILE)) {
  const env = JSON.parse(fs.readFileSync(ENV_FILE, "utf-8"));
  process.env.MONGO_URI = env.MONGO_URI;
  process.env.DB_NAME = env.DB_NAME;
  process.env.JWT_SECRET = env.JWT_SECRET;
}

// Force external integrations to be no-op/fast-fail during tests:
// - S3 headBucket will fail fast with these fake creds, so the CLI push falls
//   back to MongoDB storage (which is what we want to test) instead of writing
//   real commit files into the production S3 bucket.
// - Pinecone/Gemini require an apiKey to be *present* at module load (the
//   Pinecone constructor validates presence, not validity). We never call them
//   in these flows, so a dummy key keeps imports from throwing in CI, where
//   there is no .env file. dotenv does not override already-set env vars, so
//   these dummies are used even when a real .env exists locally.
process.env.AWS_ACCESS_KEY_ID = "nope";
process.env.AWS_SECRET_ACCESS_KEY = "nope";
process.env.AWS_REGION = "us-east-1";

process.env.PINECONE_API_KEY = "test-dummy-key";
process.env.PINECONE_INDEX = "test-dummy-index";
process.env.GOOGLE_API_KEY = "test-dummy-key";