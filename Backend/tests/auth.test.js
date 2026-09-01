// Backend/tests/auth.test.js
// Auth flows: signup, login success, wrong password, invalid token rejected.
import request from "supertest";
import { buildApp } from "./app.js";

let app;

beforeAll(async () => {
  app = await buildApp();
});

test("signup creates a user and returns a JWT", async () => {
  const res = await request(app).post("/signup").send({
    username: "auth_alice",
    email: "auth_alice@example.com",
    password: "correct-horse",
  });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("token");
  expect(typeof res.body.token).toBe("string");
  expect(res.body).toHaveProperty("userId");
});

test("login with correct credentials returns a JWT", async () => {
  const res = await request(app).post("/login").send({
    email: "auth_alice@example.com",
    password: "correct-horse",
  });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("token");
});

test("login with wrong password is rejected", async () => {
  const res = await request(app).post("/login").send({
    email: "auth_alice@example.com",
    password: "wrong-password",
  });

  expect(res.status).toBe(401);
});

test("request with an invalid access token is rejected", async () => {
  const res = await request(app)
    .get("/repo/user/000000000000000000000000")
    .set("Authorization", "Bearer not-a-real-token");

  expect(res.status).toBe(401);
});

test("request with no Authorization header is rejected", async () => {
  const res = await request(app).get("/repo/user/000000000000000000000000");
  expect(res.status).toBe(401);
});