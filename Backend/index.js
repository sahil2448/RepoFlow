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
import { registerReviewSignaling } from "./helpers/reviewSignaling.js";
import { cliLogin, cliLogout, cliWhoami } from "./controllers/cliAuth.js";

dotenv.config();

if (process.argv.length <= 2) {
  startServer();
} else {

  yargs(hideBin(process.argv))
    .command("start", "Start the server", {}, startServer)

    .command(
      "login",
      "Log in to RepoFlow",
      (y) => {
        y.option("email", { type: "string" })
          .option("password", { type: "string" })
          .option("api", { type: "string" });
      },
      (argv) => cliLogin(argv),
    )

    .command("logout", "Log out", {}, cliLogout)
    .command("whoami", "Show logged-in user", {}, cliWhoami)

    .command(
      "init <repoName>",
      "Link this folder to a repository by name",
      (y) => {
        y.positional("repoName", { type: "string" }).option("private", {
          type: "boolean",
        });
      },
      (argv) => initRepo(argv),
    )

    .command(
      "add <file>",
      "Stage a file",
      (y) => {
        y.positional("file", { type: "string" });
      },
      (argv) => addRepo(argv.file),
    )

    .command(
      "commit <message>",
      "Commit staged files",
      (y) => {
        y.positional("message", { type: "string" });
      },
      (argv) => commitRepo(argv.message),
    )

    .command("push", "Push commits to RepoFlow", {}, () => pushRepo())
    .command("pull", "Pull the latest commit", {}, () => pullRepo())

    .command(
      "revert <commitId>",
      "Restore files from a commit",
      (y) => {
        y.positional("commitId", { type: "string" });
      },
      (argv) => revertRepo(argv.commitId),
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
          "https://d1a5t55vpx2f0b.cloudfront.net",
          "https://d16mxn9cxjmykw.cloudfront.net",
          "http://localhost:3000",
          "http://localhost:5173",
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
          "https://d1a5t55vpx2f0b.cloudfront.net",
          "https://d16mxn9cxjmykw.cloudfront.net",
          "http://localhost:3000",
          "http://localhost:5173",
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      },
    });

    setIO(io);
    // ✅ TEMPORARY — raw connection + catch-all event logger
    io.on("connection", (socket) => {
      console.log("🔌 RAW CONNECTION — socket id:", socket.id);

      socket.onAny((eventName, ...args) => {
        console.log(
          "📨 SERVER RECEIVED EVENT:",
          eventName,
          JSON.stringify(args),
        );
      });
    });

    registerReviewSignaling(io);

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
}
