// Backend/tests/repo.test.js
// Repo CRUD: create, read, delete as owner, delete blocked for non-owner.
import request from "supertest";
import { buildApp } from "./app.js";

let app;

async function signup(username, email) {
  const res = await request(app).post("/signup").send({
    username,
    email,
    password: "password-123",
  });
  return { token: res.body.token, userId: res.body.userId };
}

beforeAll(async () => {
  app = await buildApp();
});

test("repo owner can create a repository", async () => {
  const { token } = await signup("repo_owner", "repo_owner@example.com");

  const res = await request(app)
    .post("/repo/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "awesome-project", description: "a test repo" });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("repositoryId");
});

test("a repository can be read by id", async () => {
  const { token } = await signup("repo_reader", "repo_reader@example.com");
  const created = await request(app)
    .post("/repo/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "readable-repo", description: "to be read" });

  const repoId = created.body.repositoryId;

  const res = await request(app).get(`/repo/${repoId}`);
  expect(res.status).toBe(200);
  expect(res.body.repository.name).toBe("readable-repo");
});

test("a non-owner cannot delete another user's repository", async () => {
  const { token: ownerToken } = await signup("repo_boss", "repo_boss@example.com");
  const { token: intruderToken } = await signup("repo_hacker", "repo_hacker@example.com");

  const created = await request(app)
    .post("/repo/create")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ name: "private-repo", description: "mine" });

  const repoId = created.body.repositoryId;

  const res = await request(app)
    .delete(`/repo/delete/${repoId}`)
    .set("Authorization", `Bearer ${intruderToken}`);

  expect(res.status).toBe(403);
});

test("the owner can delete their repository", async () => {
  const { token } = await signup("repo_cleaner", "repo_cleaner@example.com");
  const created = await request(app)
    .post("/repo/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "doomed-repo", description: "about to go" });

  const repoId = created.body.repositoryId;

  const res = await request(app)
    .delete(`/repo/delete/${repoId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(200);
});