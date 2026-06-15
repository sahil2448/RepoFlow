import express from "express";
import {
  createRepository,
  deleteRepositoryById,
  fetchRepositoriesForCurrentUser,
  fetchRepositoryById,
  fetchRepositoryByName,
  getAllRepositories,
  starRepository,
  toggleVisibility,
  updateRepositoryById,
} from "../controllers/repoController.js";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  authorizeUser,
  authorizeRepositoryOwner,
} from "../Middleware/authorizeMiddleware.js";

const repoRouter = express.Router();

repoRouter.get("/", (req, res) => {
  res.send("repo router");
});

repoRouter.post("/repo/create", authMiddleware, createRepository);
repoRouter.get("/repo/all", getAllRepositories);
repoRouter.get(
  "/repo/user/:userId",
  authMiddleware,
  authorizeUser("userId"),
  fetchRepositoriesForCurrentUser,
);
repoRouter.get("/repo/name/:name", fetchRepositoryByName);
repoRouter.put(
  "/repo/update/:id",
  authMiddleware,
  authorizeRepositoryOwner,
  updateRepositoryById,
);
repoRouter.patch(
  "/repo/toggle/:id",
  authMiddleware,
  authorizeRepositoryOwner,
  toggleVisibility,
);
repoRouter.delete(
  "/repo/delete/:id",
  authMiddleware,
  authorizeRepositoryOwner,
  deleteRepositoryById,
);
repoRouter.post("/repo/star/:id", authMiddleware, starRepository);

repoRouter.get("/repo/:id", fetchRepositoryById);

export default repoRouter;
