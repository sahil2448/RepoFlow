import fs from "fs/promises";
import path from "path";
export async function addRepo(filePath) {
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const stagingAreaPath = path.join(repoPath, "staging");

  try {
    await fs.mkdir(stagingAreaPath, { recursive: true });
    const filename = path.basename(filePath);
    await fs.copyFile(filePath, path.join(stagingAreaPath, filename));
    console.log(`File ${filename} added to staging area successfully`);
  } catch (error) {
    console.error("Error adding file to staging area:", error);
  }
}
