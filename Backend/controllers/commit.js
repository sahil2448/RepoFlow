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

    if (files.length === 0) {
      console.log("Nothing to commit — staging area is empty.");
      return;
    }

    // Copy staged files into the commit folder
    for (const file of files) {
      await fs.copyFile(
        path.join(stagingAreaPath, file),
        path.join(commitDir, file),
      );
    }

    // Write metadata — filter commit.json out of files[] so it
    // doesn't appear as a user file in CommitHistory
    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify(
        {
          message,
          date: new Date().toISOString(),
          files: files.filter((f) => f !== "commit.json"), // ✅ clean list
        },
        null,
        2,
      ),
    );

    // Clear staging after commit (like real git)
    for (const file of files) {
      await fs.unlink(path.join(stagingAreaPath, file));
    }

    // ✅ Single log — removed the duplicate
    console.log(`Commit ${commitID} created with message: "${message}"`);
    console.log(`Files committed: ${files.join(", ")}`);
  } catch (error) {
    console.error("Error committing file:", error);
  }
}
