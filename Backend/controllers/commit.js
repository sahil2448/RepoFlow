import fs from "fs/promises";
import path from "path";
import { v4 } from "uuid";

export async function commitRepo(message) {
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const stagingAreaPath = path.join(repoPath, "staging");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const commitID = v4();
    const commitDir = path.join(commitsPath, commitID);
    await fs.mkdir(commitDir, { recursive: true });
    const files = await fs.readdir(stagingAreaPath);

    for (const file of files) {
      await fs.copyFile(
        path.join(stagingAreaPath, file),
        path.join(commitDir, file),
      );
    }

    fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify({ message, date: new Date().toISOString() }),
    );

    console.log(`Commit ${commitID} created with message ${message}`);
  } catch (error) {
    console.error("Error committing file:", error);
  }

  console.log("File commited sucessfully");
}
