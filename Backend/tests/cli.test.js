// Backend/tests/cli.test.js
// CLI push endpoint: success case, bad repo id failure, and no-auth failure.
import request from "supertest";
import { buildApp } from "./app.js";

let app;

async function signup(username, email) {
  const res = await request(app).post("/signup").send({
    username,
    email,
    password: "cli-password",
  });
  return { token: res.body.token, userId: res.body.userId };
}

beforeAll(async () => {
  app = await buildApp();
});

test("CLI init + push succeed and use MongoDB storage fallback", async () => {
  const { token } = await signup("cli_dev", "cli_dev@example.com");

  const initRes = await request(app)
    .post("/cli/repo/init")
    .set("Authorization", `Bearer ${token}`)
    .send({ repoName: "cli-playground", visibility: true });

  expect(initRes.status).toBe(200);
  const repoId = initRes.body.repoId;

  const pushRes = await request(app)
    .post(`/cli/repo/${repoId}/push`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      commitId: "abc-123",
      message: "test push from CLI",
      files: [{ name: "hello.txt", content: Buffer.from("hello").toString("base64") }],
    });

  expect(pushRes.status).toBe(200);
  expect(pushRes.body).toHaveProperty("commitId", "abc-123");
  expect(["s3", "mongodb"]).toContain(pushRes.body.storageType);
});

test("CLI push with an unknown repo id returns 404", async () => {
  const { token } = await signup("cli_misfit", "cli_misfit@example.com");

  const res = await request(app)
    .post("/cli/repo/000000000000000000000000/push")
    .set("Authorization", `Bearer ${token}`)
    .send({
      message: "nowhere",
      files: [{ name: "a.txt", content: Buffer.from("a").toString("base64") }],
    });

  expect(res.status).toBe(404);
});

test("CLI push without an auth token is rejected", async () => {
  const res = await request(app)
    .post("/cli/repo/000000000000000000000000/push")
    .send({
      message: "anon",
      files: [{ name: "a.txt", content: Buffer.from("a").toString("base64") }],
    });

  expect(res.status).toBe(401);
});

test("a collaborator can push to a repo, a non-member cannot", async () => {
  const owner = await signup("cli_collab_owner", "cli_collab_owner@example.com");
  const collab = await signup("cli_collab_dev", "cli_collab_dev@example.com");
  const outsider = await signup("cli_collab_out", "cli_collab_out@example.com");

  const initRes = await request(app)
    .post("/cli/repo/init")
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ repoName: "collab-repo", visibility: true });
  const repoId = initRes.body.repoId;

  // Owner grants collaborator access
  const addRes = await request(app)
    .post(`/repo/collaborators/${repoId}`)
    .set("Authorization", `Bearer ${owner.token}`)
    .send({ userId: collab.userId });
  expect(addRes.status).toBe(200);

  // Collaborator can push
  const collabPush = await request(app)
    .post(`/cli/repo/${repoId}/push`)
    .set("Authorization", `Bearer ${collab.token}`)
    .send({
      message: "from collaborator",
      files: [{ name: "b.txt", content: Buffer.from("b").toString("base64") }],
    });
  expect(collabPush.status).toBe(200);

  // Outsider is forbidden
  const outsidePush = await request(app)
    .post(`/cli/repo/${repoId}/push`)
    .set("Authorization", `Bearer ${outsider.token}`)
    .send({
      message: "intrusion",
      files: [{ name: "c.txt", content: Buffer.from("c").toString("base64") }],
    });
  expect(outsidePush.status).toBe(403);
});