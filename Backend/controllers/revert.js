import fs from "fs";
import path from "path";
import { s3, S3_BUCKET } from "../config/aws-config.js";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);
export async function revertRepo(commitID) {
  const repoPath = await path.resolve(process.cwd(), ".repoFlowGit");
  const commitsPath = await path.join(repoPath, "commits");

  try {
    const commitDir = await path.join(commitsPath, commitID);
    const files = await readdir(commitDir);
    const parendDir = path.resolve(repoPath, "..");

    for (const file of files) {
      await copyFile(path.join(commitDir, file), path.join(parendDir, file));
    }
    console.log(`Commit ${commitID} reverted back`);
  } catch (err) {
    console.error("Unable to revert: ", err);
  }
  console.log("File reverted back sucessfully");
}
