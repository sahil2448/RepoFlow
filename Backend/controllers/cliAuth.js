import readline from "readline";
import {
  saveCredentials,
  loadCredentials,
  clearCredentials,
} from "../helpers/cliConfig.js";

export const DEFAULT_API_URL = "https://d1a5t55vpx2f0b.cloudfront.net";

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function cliLogin(argv = {}) {
  const apiUrl = argv.api || DEFAULT_API_URL;
  const email = argv.email || (await prompt("Email: "));
  const password = argv.password || (await prompt("Password: "));

  try {
    const res = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.error(`Login failed: ${data.error || res.statusText}`);
      return;
    }

    saveCredentials({ token: data.token, userId: data.userId, apiUrl });
    console.log("Logged in successfully.");
    console.log(`Connected to: ${apiUrl}`);
  } catch (err) {
    console.error("Login failed — could not reach server:", err.message);
  }
}

export function cliLogout() {
  clearCredentials();
  console.log("Logged out. Credentials cleared.");
}

export function cliWhoami() {
  const creds = loadCredentials();
  if (!creds) {
    console.log("Not logged in. Run: node index.js login");
    return;
  }
  console.log(`Logged in. userId: ${creds.userId}`);
  console.log(`API: ${creds.apiUrl}`);
}
