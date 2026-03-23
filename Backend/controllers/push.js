import fs from "fs/promises";
import path from "path";

import { s3, S3_BUCKET } from "../config/aws-config.js";

export async function pushRepo() {
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const commitDirs = await fs.readdir(commitsPath);

    for (const commitDir of commitDirs) {
      const commitDirPath = path.join(commitsPath, commitDir);

      const files = await fs.readdir(commitDirPath);

      for (const file of files) {
        const filePath = path.join(commitDirPath, file);
        const fileContent = await fs.readFile(filePath);

        const params = {
          Bucket: S3_BUCKET,
          Key: `commits/${commitDir}/${file}`,
          Body: fileContent,
        };

        await s3.upload(params).promise();
      }
    }

    console.log("All commits pushed to S3");
  } catch (error) {
    console.error("Error pushing file to S3:", error);
  }
}
