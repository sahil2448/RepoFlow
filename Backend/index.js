import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initRepo } from "./controllers/init.js";
import { addRepo } from "./controllers/add.js";
import { commitRepo } from "./controllers/commit.js";
import { pullRepo } from "./controllers/pull.js";
import { pushRepo } from "./controllers/push.js";
import { revertRepo } from "./controllers/revert.js";

yargs(hideBin(process.argv))
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
    addRepo,
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
    commitRepo,
  )
  .command("push", "push file to the repository/(S3)", {}, pushRepo)
  .command("pull", "pull file from the repository/(S3)", {}, commitRepo)
  .command(
    "revert <commitID>",
    "Revert file to the repository",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "revert commit ID",
        type: "string",
      });
    },
    revertRepo,
  )
  .demandCommand(1, "Please specify a command")
  .help().argv;
