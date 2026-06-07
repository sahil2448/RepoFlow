import fs from "fs/promises"; // use fs/promises like every other controller
import path from "path";
//  removed unused s3 and S3_BUCKET import

export async function revertRepo(commitID) {
  //  path.resolve and path.join are sync — no await needed
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const commitDir = path.join(commitsPath, commitID);
    const files = await fs.readdir(commitDir);
    const parentDir = path.resolve(repoPath, "..");

    // Skip commit.json — it's metadata, not a user file
    const userFiles = files.filter((f) => f !== "commit.json");

    if (userFiles.length === 0) {
      console.log("No files found in this commit.");
      return;
    }

    for (const file of userFiles) {
      await fs.copyFile(path.join(commitDir, file), path.join(parentDir, file));
      console.log(`  restored: ${file}`);
    }

    console.log(`Commit ${commitID} reverted successfully.`);
  } catch (err) {
    console.error("Unable to revert:", err);
  }
}
