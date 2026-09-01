// Backend/tests/global-teardown.js
// Stops the in-memory MongoDB and cleans up the temp env file.
import fs from "fs";
import os from "os";
import path from "path";

export default async function globalTeardown() {
  const ENV_FILE = path.join(os.tmpdir(), "repoflow-test-env.json");
  if (fs.existsSync(ENV_FILE)) fs.rmSync(ENV_FILE, { force: true });

  if (
    globalThis.__repoflowMongoServer__ &&
    typeof globalThis.__repoflowMongoServer__.stop === "function"
  ) {
    await globalThis.__repoflowMongoServer__.stop();
  }
}