import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initRepo } from "./controllers/init.js";
import { addRepo } from "./controllers/add.js";
import { commitRepo } from "./controllers/commit.js";
import { pullRepo } from "./controllers/pull.js";
import { pushRepo } from "./controllers/push.js";
import express from "express";
import { revertRepo } from "./controllers/revert.js";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mainRouter from "./routes/main.router.js";

dotenv.config();

yargs(hideBin(process.argv))
  .command("start", "Start the server", {}, startServer)

  // ✅ Fix 2: added builder for --repoId and --userId, pass argv to initRepo
  .command(
    "init",
    "Initialize the new repository",
    (yargs) => {
      yargs
        .option("repoId", {
          type: "string",
          describe: "MongoDB Repository ID to link this folder to",
        })
        .option("userId", {
          type: "string",
          describe: "Your MongoDB User ID",
        });
    },
    (argv) => {
      initRepo(argv);
    },
  )

  .command(
    "add <file>",
    "Add a new file to the repository",
    (yargs) => {
      yargs.positional("file", {
        describe: "File to add to the staging area",
        type: "string",
      });
    },
    (argv) => {
      addRepo(argv.file);
    },
  )

  .command(
    "commit <message>",
    "Commit file to the repository",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    (argv) => {
      commitRepo(argv.message);
    },
  )

  // ✅ Fix 3: pass argv to pushRepo so it can read flags if needed
  .command("push", "Push commits to S3 and MongoDB", {}, (argv) => {
    pushRepo(argv);
  })

  .command("pull", "Pull commits from S3", {}, pullRepo)

  .command(
    "revert <commitID>",
    "Revert to a specific commit",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "Commit ID to revert to",
        type: "string",
      });
    },
    (argv) => {
      revertRepo(argv.commitID);
    },
  )

  .demandCommand(1, "Please specify a command")
  .help().argv;

// ✅ Fix 1: let instead of const — socket.io reassigns this
let user = "userXYZ";

async function startServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(express.json());

  const mongoURI = process.env.MONGO_URI;

  try {
    await mongoose.connect(mongoURI, {
      dbName: process.env.DB_NAME,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use("/", mainRouter);

  app.get("/", (req, res) => {
    res.send("Welcome!");
  });

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (userID) => {
      user = userID; // ✅ now works — let allows reassignment
      console.log("=====");
      console.log(user);
      console.log("=====");
      socket.join(userID);
    });
  });

  const db = mongoose.connection;
  db.once("open", async () => {
    console.log("CRUD OPERATIONS CALLED");
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  console.log("Server has started!");
}
