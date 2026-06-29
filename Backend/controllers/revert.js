// import fs from "fs/promises";
// import path from "path";

// export async function revertRepo(commitID) {

//   const repoPath = path.resolve(process.cwd(), ".repoFlowGit");
//   const commitsPath = path.join(repoPath, "commits");

//   try {
//     const commitDir = path.join(commitsPath, commitID);
//     const files = await fs.readdir(commitDir);
//     const parentDir = path.resolve(repoPath, "..");

//     const userFiles = files.filter((f) => f !== "commit.json");

//     if (userFiles.length === 0) {
//       console.log("No files found in this commit.");
//       return;
//     }

//     for (const file of userFiles) {
//       await fs.copyFile(path.join(commitDir, file), path.join(parentDir, file));
//       console.log(`  restored: ${file}`);
//     }

//     console.log(`Commit ${commitID} reverted successfully.`);
//   } catch (err) {
//     console.error("Unable to revert:", err);
//   }
// }

import fs from "fs/promises";
import path from "path";
import { loadCredentials, loadLocalConfig } from "../helpers/cliConfig.js";

export async function revertRepo(commitId) {
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
  if (!commitId) {
    console.error("Usage: node index.js revert <commitId>");
    return;
  }

  try {
    const res = await fetch(
      `${creds.apiUrl}/repo/${config.repoId}/revert/${commitId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.token}` },
      },
    );
    const { fileUrls, error } = await res.json();
    if (!res.ok) {
      console.error(`Revert failed: ${error}`);
      return;
    }

    for (const { file, url } of fileUrls || []) {
      const buffer = url.startsWith("data:")
        ? Buffer.from(url.split(",")[1], "base64")
        : Buffer.from(await (await fetch(url)).arrayBuffer());
      await fs.writeFile(path.join(process.cwd(), file), buffer);
      console.log(`  ↻ ${file}`);
    }
    console.log(`Reverted to ${commitId.slice(0, 7)}... successfully.`);
  } catch (error) {
    console.error("Unable to revert:", error.message);
  }
}
