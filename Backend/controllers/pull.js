// File system + path helpers, and our configured S3 client/bucket.
import fs from "fs/promises";
import path from "path";
import { s3, S3_BUCKET } from "../config/aws-config.js";

export async function pullRepo() {
  // Local repo folders where we store pulled commit files.
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    // List all commit objects stored in S3 under "commits/".
    const data = await s3
      .listObjectsV2({
        Bucket: S3_BUCKET,
        Prefix: "commits/",
      })
      .promise();

    // S3 returns a list of objects; we'll download each one.
    const objects = data.Contents;

    for (const object of objects) {
      // Build the local folder for this commit file.
      const key = object.Key;
      // Use the full key path so nested commit folders are created correctly.
      // Example key: "commits/<uuid>/commit.json"
      const commitDir = path.join(
        commitsPath,
        path.dirname(key).split("/").pop(),
      );

      // Ensure the commit directory exists.
      await fs.mkdir(commitDir, { recursive: true });

      // Prepare the S3 download parameters.
      const params = {
        Bucket: S3_BUCKET,
        Key: key,
      };

      // Download the file from S3.
      const fileContent = await s3.getObject(params).promise();

      // Write the file to the local repo path.
      await fs.writeFile(path.join(repoPath, key), fileContent.Body);

      console.log(`All commits are pulled from S3`);
    }
  } catch (error) {
    // Basic error handling for the pull operation.
    console.error("Error pulling files from S3", error);
  }
}
