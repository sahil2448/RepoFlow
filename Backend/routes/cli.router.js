import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js"; // match your existing import style
import { authorizeRepositoryMember } from "../Middleware/authorizeMiddleware.js";
import {
  findOrCreateRepoByName,
  pushCliCommit,
} from "../controllers/cliController.js";

const cliRouter = express.Router();

cliRouter.post("/cli/repo/init", authMiddleware, findOrCreateRepoByName);
cliRouter.post(
  "/cli/repo/:repoId/push",
  authMiddleware,
  authorizeRepositoryMember, // owner OR collaborator may push
  pushCliCommit,
);

export default cliRouter;
