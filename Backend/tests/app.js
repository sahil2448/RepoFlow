// Backend/tests/app.js
// Builds a minimal Express app that mounts the SAME routers used in
// production, but pointed at the in-memory MongoDB. This tests the real
// routing, real auth middleware, and real controllers end-to-end.
import express from "express";
import mongoose from "mongoose";

const alreadyConnected = () => mongoose.connection.readyState === 1;

export async function buildApp() {
  if (!alreadyConnected()) {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });
  }

  const { default: mainRouter } = await import("../routes/main.router.js");

  const app = express();
  app.use(express.json());
  app.use("/", mainRouter);

  return app;
}