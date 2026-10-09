// Usage:
//   node scripts/reset-password.mjs <email> <newPassword> [--db]
// Direct MongoDB password reset for account recovery (no email flow exists yet).
// Uses the same bcrypt cost (10) and min length (6) as controllers/userCcontroller.js.
// Never logs the password.
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MIN_PASSWORD_LENGTH = 6;

function usage() {
  console.log("Usage: node scripts/reset-password.mjs <email> <newPassword> [--db]");
}

const args = process.argv.slice(2).filter((a) => a !== "--db");
const useDb = process.argv.includes("--db");
const [emailArg, newPassword] = args;

if (!emailArg || !newPassword) {
  usage();
  process.exit(1);
}
const email = emailArg.trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Please enter a valid email address.");
  process.exit(1);
}
if (newPassword.length < MIN_PASSWORD_LENGTH) {
  console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  process.exit(1);
}

if (!useDb) {
  console.error("This build supports only --db mode. Re-run with --db flag.");
  console.error("Example: node scripts/reset-password.mjs you@example.com 'new-pass-123' --db");
  process.exit(1);
}

const { MongoClient } = await import("mongodb");
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
if (!uri || !dbName) {
  console.error("MONGO_URI and DB_NAME must be set in Backend/.env");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const col = client.db(dbName).collection("users");
  const user = await col.findOne({ email });
  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await col.updateOne({ _id: user._id }, { $set: { password: hashed } });
  console.log(`Password reset for ${email} (username: ${user.username}). You can now login.`);
} catch (e) {
  console.error("Reset failed:", e.message);
  process.exit(1);
} finally {
  await client.close();
}
