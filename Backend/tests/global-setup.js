// Backend/tests/global-setup.js
// Starts a real MongoDB binary in-memory (via mongodb-memory-server) and makes
// its connection string available to the test workers through a temp file.
// Tests NEVER touch the real Atlas cluster.
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import os from "os";
import path from "path";

const ENV_FILE = path.join(os.tmpdir(), "repoflow-test-env.json");

export default async function globalSetup() {
  const server = await MongoMemoryServer.create();
  const uri = server.getUri();

  fs.writeFileSync(
    ENV_FILE,
    JSON.stringify({
      MONGO_URI: uri,
      DB_NAME: "repoflow_test_db",
      JWT_SECRET: "repoflow-test-secret",
    }),
  );

  // Keep a handle so teardown can stop it even though setup runs in its own
  // process context.
  globalThis.__repoflowMongoServer__ = server;
  globalThis.__repoflowEnvFile__ = ENV_FILE;
}