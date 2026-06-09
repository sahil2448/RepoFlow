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
import { setIO } from "./helpers/socketInstance.js";

dotenv.config();

yargs(hideBin(process.argv))
  .command("start", "Start the server", {}, startServer)

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

let user = "userXYZ";

async function startServer() {
  const app = express();

  app.use(
    cors({
      origin: [
        "https://main.d1zjk4pi7u9tt9.amplifyapp.com",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

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

  app.use("/", mainRouter);

  app.get("/", (req, res) => {
    res.send("Welcome!");
  });

  const httpServer = http.createServer(app);

  const userSocketMap = new Map();

  const io = new Server(httpServer, {
    cors: {
      origin: [
        "https://main.d1zjk4pi7u9tt9.amplifyapp.com",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  });

  setIO(io);
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(userId);
      userSocketMap.set(userId, socket.id);
      console.log(`  User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          break;
        }
      }
    });
  });

  const db = mongoose.connection;
  db.once("open", async () => {
    console.log("CRUD OPERATIONS CALLED");
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });

  console.log("Server has started!");
}
