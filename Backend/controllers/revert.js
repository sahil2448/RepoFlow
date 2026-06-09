import fs from "fs/promises"; 
import path from "path";


export async function revertRepo(commitID) {
  
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const commitDir = path.join(commitsPath, commitID);
    const files = await fs.readdir(commitDir);
    const parentDir = path.resolve(repoPath, "..");

    
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
