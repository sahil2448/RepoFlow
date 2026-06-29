// import fs from "fs/promises";

// import path from "path";

// export async function initRepo(argv = {}) {

//   const repoPath = path.resolve(process.cwd(), ".repoFlowGit");

//   const commitsPath = path.join(repoPath, "commits");

//   try {
//     await fs.mkdir(repoPath, { recursive: true });
//     await fs.mkdir(commitsPath, { recursive: true });

//     await fs.writeFile(
//       path.join(repoPath, "config.json"),
//       JSON.stringify(
//         {
//           bucket: process.env.S3_bucket,
//           repoId: argv.repoId || null,
//           userId: argv.userId || null,
//           createdAt: new Date().toISOString(),
//         },
//         null,
//         2,
//       ),
//     );
//     console.log("Repo initialized successfully");
//     if (argv.repoId) console.log(`  linked to repoId: ${argv.repoId}`);
//     if (argv.userId) console.log(`  linked to userId: ${argv.userId}`);
//   } catch (error) {
//     console.error("Error initializing repository:", error);
//   }

// }

import { loadCredentials, saveLocalConfig } from "../helpers/cliConfig.js";
import fs from "fs/promises";
import path from "path";

export async function initRepo(argv = {}) {
  const repoName = argv.repoName;
  const creds = loadCredentials();

  if (!creds) {
    console.error("Run: node index.js login first.");
    return;
  }
  if (!repoName) {
    console.error("Usage: node index.js init <repoName>");
    return;
  }

  const repoFlowDir = path.resolve(process.cwd(), ".repoFlowGit");
  await fs.mkdir(path.join(repoFlowDir, "commits"), { recursive: true });
  await fs.mkdir(path.join(repoFlowDir, "staging"), { recursive: true });

  try {
    console.log("CREDS:", creds);
    console.log("URL:", `${creds.apiUrl}/cli/repo/init`);
    const res = await fetch(`${creds.apiUrl}/cli/repo/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.token}`,
      },
      body: JSON.stringify({ repoName, visibility: !argv.private }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error(`Init failed: ${data.error || res.statusText}`);
      return;
    }

    saveLocalConfig({
      repoId: data.repoId,
      repoName: data.repoName,
      apiUrl: creds.apiUrl,
      userId: creds.userId,
      pushedCommits: [],
    });

    console.log(
      `Repository linked: "${data.repoName}" (${data.visibility ? "public" : "private"})`,
    );
  } catch (error) {
    console.error("Error initializing repository:", error.message);
  }
}
