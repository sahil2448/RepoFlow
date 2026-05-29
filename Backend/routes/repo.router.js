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

const repoRouter = express.Router();

repoRouter.get("/", (req, res) => {
  res.send("repo router");
});

// ── Specific static-segment routes first ──
repoRouter.post("/repo/create", createRepository);
repoRouter.get("/repo/all", getAllRepositories);
repoRouter.get("/repo/user/:userId", fetchRepositoriesForCurrentUser);
repoRouter.get("/repo/name/:name", fetchRepositoryByName);
repoRouter.put("/repo/update/:id", updateRepositoryById);
repoRouter.patch("/repo/toggle/:id", toggleVisibility);
repoRouter.delete("/repo/delete/:id", deleteRepositoryById);
repoRouter.post("/repo/star/:id", starRepository);

// ── Dynamic :id catch-all last — always ──
repoRouter.get("/repo/:id", fetchRepositoryById);

export default repoRouter;
