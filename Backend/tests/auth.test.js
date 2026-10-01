// Backend/tests/auth.test.js
// Auth flows: signup, login success, wrong password, invalid token rejected,
// plus validation: empty submissions must never succeed or issue a JWT.
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
// ── Regression: empty / missing credentials must NEVER log in ────────────────
test("login with empty email and password is rejected with 400", async () => {
  const res = await request(app)
    .post("/login")
    .send({ email: "", password: "" });
  expect(res.status).toBe(400);
  expect(res.body).not.toHaveProperty("token");
});
test("login with missing body is rejected with 400", async () => {
  const res = await request(app).post("/login").send({});
  expect(res.status).toBe(400);
  expect(res.body).not.toHaveProperty("token");
});
test("login with missing password is rejected with 400", async () => {
  const res = await request(app)
    .post("/login")
    .send({ email: "auth_alice@example.com" });
  expect(res.status).toBe(400);
});
test("login with unknown credentials is rejected with 401", async () => {
  const res = await request(app).post("/login").send({
    email: "nobody@example.com",
    password: "whatever",
  });
  expect(res.status).toBe(401);
  expect(res.body).not.toHaveProperty("token");
});
// ── Regression: signup must not create throwaway empty-credential users ──────
test("signup with empty fields is rejected with 400", async () => {
  const res = await request(app).post("/signup").send({
    username: "",
    email: "",
    password: "",
  });
  expect(res.status).toBe(400);
  expect(res.body).not.toHaveProperty("token");
});
test("signup with an invalid email is rejected with 400", async () => {
  const res = await request(app).post("/signup").send({
    username: "auth_bademail",
    email: "not-an-email",
    password: "correct-horse",
  });
  expect(res.status).toBe(400);
});
test("signup with a short password is rejected with 400", async () => {
  const res = await request(app).post("/signup").send({
    username: "auth_shortpw",
    email: "auth_shortpw@example.com",
    password: "123",
  });
  expect(res.status).toBe(400);
});
test("signup with a duplicate email is rejected", async () => {
  const email = "auth_duplicate@example.com";
  const first = await request(app).post("/signup").send({
    username: "auth_dup_one",
    email,
    password: "correct-horse",
  });
  expect(first.status).toBe(200);
  const second = await request(app).post("/signup").send({
    username: "auth_dup_two",
    email,
    password: "correct-horse",
  });
  expect(second.status).toBe(409);
  expect(second.body.error).toContain("email");
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