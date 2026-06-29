import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js"; // match your existing import style
import {
  findOrCreateRepoByName,
  pushCliCommit,
} from "../controllers/cliController.js";

const cliRouter = express.Router();

cliRouter.post("/cli/repo/init", authMiddleware, findOrCreateRepoByName);
cliRouter.post("/cli/repo/:repoId/push", authMiddleware, pushCliCommit);

export default cliRouter;
