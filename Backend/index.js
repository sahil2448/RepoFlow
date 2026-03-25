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

dotenv.config();
yargs(hideBin(process.argv))
  .command("start", "Start the server", {}, startServer)
  .command("init", "Initialize the new repository", {}, initRepo)
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
  .command("push", "push file to the repository/(S3)", {}, pushRepo)
  .command("pull", "pull file from the repository/(S3)", {}, pullRepo)
  .command(
    "revert <commitID>",
    "Revert file to the repository",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "revert commit ID",
        type: "string",
      });
    },
    (argv) => {
      revertRepo(argv.commitID);
    },
  )
  .demandCommand(1, "Please specify a command")
  .help().argv;

const user = "userXYZ";
function startServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(express.json());

  const mongoURI = process.env.MONGO_URI;

  mongoose
    .connect(mongoURI)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => console.log("Error connecting to MongoDB", err));

  app.use(cors({ origin: "*" }));
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
      user = userID;
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

  console.log("Server has started !");
}
