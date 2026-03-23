// Import the 'fs' module for file system operations
import fs from "fs/promises";

// Import the 'path' module to handle file paths
import path from "path";

// This function initializes a new repository
export async function initRepo() {
  // Get the absolute path to the .git directory in the current working directory
  const repoPath = path.resolve(process.cwd(), ".repoFlowGit");

  // Set the path for the commits folder inside the .git directory
  const commitsPath = path.join(repoPath, "commits");

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });
    // Write an empty config.json file (or with default content)
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify({ bucket: process.env.S3_bucket }),
    );
    console.log("Repo initialized sucessfully");
  } catch (error) {
    console.error("Error initializing repository:", error);
  }

  // Print a success message to the console
}
