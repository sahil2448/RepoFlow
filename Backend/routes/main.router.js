import express from "express";
import userRouter from "./user.router.js";
import repoRouter from "./repo.router.js";
import issueRouter from "./issue.router.js";
import contributionRouter from "./contributions.router.js";
import commitRouter from "./commit.router.js";
import notificationRouter from "./notification.router.js";

const mainRouter = express.Router();
mainRouter.use(userRouter);
mainRouter.use(repoRouter);
mainRouter.use(issueRouter);
mainRouter.use(contributionRouter);
mainRouter.use(commitRouter);
mainRouter.use(notificationRouter);

mainRouter.get("/", (req, res) => {
  res.send("Main page");
});

export default mainRouter;
