// import fs from "fs/promises";
// import path from "path";
// import { s3, S3_BUCKET } from "../config/aws-config.js";

// export async function pullRepo() {

//   const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
//   const commitsPath = path.join(repoPath, "commits");

//   try {

//     const data = await s3
//       .listObjectsV2({
//         Bucket: S3_BUCKET,
//         Prefix: "commits/",
//       })
//       .promise();

//     const objects = data.Contents;

//     for (const object of objects) {

//       const key = object.Key;

//       const commitDir = path.join(
//         commitsPath,
//         path.dirname(key).split("/").pop(),
//       );

//       await fs.mkdir(commitDir, { recursive: true });

//       const params = {
//         Bucket: S3_BUCKET,
//         Key: key,
//       };

//       const fileContent = await s3.getObject(params).promise();

//       await fs.writeFile(path.join(repoPath, key), fileContent.Body);

//       console.log(`All commits are pulled from S3`);
//     }
//   } catch (error) {

//     console.error("Error pulling files from S3", error);
//   }
// }

import fs from "fs/promises";
import path from "path";
import { loadCredentials, loadLocalConfig } from "../helpers/cliConfig.js";

export async function pullRepo() {
  const creds = loadCredentials();
  const config = loadLocalConfig();
  if (!creds) {
    console.error("Run: node index.js login first.");
    return;
  }
  if (!config?.repoId) {
    console.error("Run: node index.js init <repoName> first.");
    return;
  }

  try {
    const commitsRes = await fetch(
      `${creds.apiUrl}/repo/${config.repoId}/commits`,
      {
        headers: { Authorization: `Bearer ${creds.token}` },
      },
    );
    const { commits } = await commitsRes.json();
    if (!commits?.length) {
      console.log("No commits found on server.");
      return;
    }

    const latest = commits[0];
    console.log(
      `Pulling: "${latest.message}" (${latest.commitId.slice(0, 7)}...)`,
    );

    const revertRes = await fetch(
      `${creds.apiUrl}/repo/${config.repoId}/revert/${latest.commitId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.token}` },
      },
    );
    const { fileUrls } = await revertRes.json();

    const targetDir = path.resolve(
      process.cwd(),
      ".repoFlowGit",
      "commits",
      latest.commitId,
    );
    await fs.mkdir(targetDir, { recursive: true });

    for (const { file, url } of fileUrls || []) {
      const buffer = url.startsWith("data:")
        ? Buffer.from(url.split(",")[1], "base64")
        : Buffer.from(await (await fetch(url)).arrayBuffer());
      await fs.writeFile(path.join(targetDir, file), buffer);
      console.log(`  ↓ ${file}`);
    }

    console.log(`Pull complete → .repoFlowGit/commits/${latest.commitId}/`);
  } catch (error) {
    console.error("Error pulling files:", error.message);
  }
}
