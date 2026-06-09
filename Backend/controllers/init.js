
import fs from "fs/promises";


import path from "path";


export async function initRepo(argv = {}) {
  
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");

  
  const commitsPath = path.join(repoPath, "commits");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });
    
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify(
        {
          bucket: process.env.S3_bucket,
          repoId: argv.repoId || null,
          userId: argv.userId || null,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    console.log("Repo initialized successfully");
    if (argv.repoId) console.log(`  linked to repoId: ${argv.repoId}`);
    if (argv.userId) console.log(`  linked to userId: ${argv.userId}`);
  } catch (error) {
    console.error("Error initializing repository:", error);
  }

  
}
