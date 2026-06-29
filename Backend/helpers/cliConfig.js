import fs from "fs";
import path from "path";
import os from "os";

const CREDENTIALS_DIR = path.join(os.homedir(), ".repoflow");
const CREDENTIALS_PATH = path.join(CREDENTIALS_DIR, "credentials.json");

export function saveCredentials(data) {
  if (!fs.existsSync(CREDENTIALS_DIR))
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(data, null, 2));
}
export function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  } catch {
    return null;
  }
}
export function clearCredentials() {
  if (fs.existsSync(CREDENTIALS_PATH)) fs.unlinkSync(CREDENTIALS_PATH);
}

function localConfigPath() {
  return path.join(process.cwd(), ".repoFlowGit", "config.json");
}
export function saveLocalConfig(data) {
  const dir = path.join(process.cwd(), ".repoFlowGit");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(localConfigPath(), JSON.stringify(data, null, 2));
}
export function loadLocalConfig() {
  if (!fs.existsSync(localConfigPath())) return null;
  try {
    return JSON.parse(fs.readFileSync(localConfigPath(), "utf-8"));
  } catch {
    return null;
  }
}
