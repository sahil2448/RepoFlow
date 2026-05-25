import { getUserContributions } from "../controllers/contributionController.js";
import express from "express";

const contributionRouter = express.Router();

contributionRouter.get("/contributions/:userId", getUserContributions);

export default contributionRouter;
