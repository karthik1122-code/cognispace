// API tests against a real (embedded) MongoDB. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.AUTH_RATE_LIMIT = "1000";
delete process.env.GEMINI_API_KEY;

const { createApp } = await import("./app.js");
const { setEmailTransport } = await import("./services/email.js");
const outbox = [];
setEmailTransport(async (m) => { outbox.push(m); return { sent: true }; });

let mongo, server, base;

test.before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  server = createApp({ serveFrontend: false }).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

async function call(path, { method = "GET", body, cookie, raw } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, headers: res.headers, cookie: (res.headers.get("set-cookie") || "").split(";")[0] };
}

const register = (email, password = "correct-horse") =>
  call("/api/auth/register", { method: "POST", body: { name: "Test User", email, password } });

let alice, bob;

test("health is public, reports the database and sends security headers", async () => {
  const r = await call("/health");
  assert.equal(r.status, 200);
  assert.equal(r.json.status, "ok");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("x-frame-options"), "DENY");
  assert.equal(r.headers.get("x-powered-by"), null);
});

test("register validates input and rejects duplicates", async () => {
  assert.equal((await register("not-an-email")).status, 400);
  assert.equal((await register("short@pw.com", "123")).status, 400);
  const a = await register("Alice@Example.com");
  assert.equal(a.status, 201);
  assert.equal(a.json.user.email, "alice@example.com", "email is normalised");
  assert.match(a.cookie, /^token=/);
  assert.equal(a.json.token, undefined, "the session token stays in the httpOnly cookie, not the response body");
  alice = a.cookie;
  assert.equal((await register("alice@example.com")).status, 409);
  bob = (await register("bob@example.com")).cookie;
});

test("login, session and the same error for wrong email or password", async () => {
  const wrong = await call("/api/auth/login", { method: "POST", body: { email: "alice@example.com", password: "nope-nope" } });
  const unknown = await call("/api/auth/login", { method: "POST", body: { email: "nobody@example.com", password: "nope-nope" } });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.json.error, wrong.json.error);
  const ok = await call("/api/auth/login", { method: "POST", body: { email: "alice@example.com", password: "correct-horse" } });
  assert.equal(ok.status, 200);
  const me = await call("/api/auth/me", { cookie: ok.cookie });
  assert.equal(me.json.user.email, "alice@example.com");
  assert.equal((await call("/api/auth/me")).status, 401);
});

test("new accounts get starter pages and tasks", async () => {
  assert.equal((await call("/api/documents", { cookie: alice })).json.length, 2);
  assert.equal((await call("/api/tasks", { cookie: alice })).json.length, 4);
});

test("pages are private to their owner", async () => {
  const doc = (await call("/api/documents", { method: "POST", cookie: alice, body: { title: "Secret plan" } })).json;
  assert.equal((await call(`/api/documents/${doc.id}`, { cookie: bob })).status, 404);
  assert.equal((await call(`/api/documents/${doc.id}`, { method: "PATCH", cookie: bob, body: { title: "hacked" } })).status, 404);
  assert.equal((await call(`/api/documents/${doc.id}`, { method: "DELETE", cookie: bob })).status, 404);
  assert.equal((await call("/api/documents/not-an-id", { cookie: alice })).status, 404);
  assert.equal((await call(`/api/documents/${doc.id}`, { cookie: alice })).json.title, "Secret plan");
});

test("saving with a stale version returns 409 with the current page", async () => {
  const doc = (await call("/api/documents", { method: "POST", cookie: alice, body: { title: "Draft" } })).json;
  const v = doc.version;
  const first = await call(`/api/documents/${doc.id}`, { method: "PATCH", cookie: alice, body: { content: "<p>tab one</p>", baseVersion: v } });
  assert.equal(first.status, 200);
  assert.equal(first.json.version, v + 1);
  const stale = await call(`/api/documents/${doc.id}`, { method: "PATCH", cookie: alice, body: { content: "<p>tab two</p>", baseVersion: v } });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.current.content, "<p>tab one</p>");
});

test("invalid page fields are rejected before reaching the database", async () => {
  const doc = (await call("/api/documents", { method: "POST", cookie: alice, body: {} })).json;
  assert.equal((await call(`/api/documents/${doc.id}`, { method: "PATCH", cookie: alice, body: { status: "Nope" } })).status, 400);
  assert.equal((await call(`/api/documents/${doc.id}`, { method: "PATCH", cookie: alice, body: { title: "x".repeat(300) } })).status, 400);
  assert.equal((await call(`/api/documents/${doc.id}`, { method: "PATCH", cookie: alice, body: { tags: "not-a-list" } })).status, 400);
  const bad = await call("/api/documents", { method: "POST", cookie: alice, raw: "{not json" });
  assert.equal(bad.status, 400);
  const big = await call("/api/documents", { method: "POST", cookie: alice, raw: JSON.stringify({ content: "x".repeat(1_200_000) }) });
  assert.equal(big.status, 413);
  assert.ok(big.json.error, "errors are JSON, not HTML");
});

test("sub-pages keep their parent, and a parent must be yours", async () => {
  const parent = (await call("/api/documents", { method: "POST", cookie: alice, body: { title: "Parent" } })).json;
  const child = await call("/api/documents", { method: "POST", cookie: alice, body: { title: "Child", parentId: parent.id } });
  assert.equal(child.status, 201);
  assert.equal(child.json.parentId, parent.id);
  const stolen = await call("/api/documents", { method: "POST", cookie: bob, body: { title: "Child", parentId: parent.id } });
  assert.equal(stolen.status, 400);
});

test("deleting a page removes its sub-pages, and a page cannot be moved under its own child", async () => {
  const top = (await call("/api/documents", { method: "POST", cookie: alice, body: { title: "Top" } })).json;
  const mid = (await call("/api/documents", { method: "POST", cookie: alice, body: { title: "Mid", parentId: top.id } })).json;
  const leaf = (await call("/api/documents", { method: "POST", cookie: alice, body: { title: "Leaf", parentId: mid.id } })).json;
  assert.equal((await call(`/api/documents/${top.id}`, { method: "PATCH", cookie: alice, body: { parentId: leaf.id } })).status, 400);
  assert.equal((await call(`/api/documents/${top.id}`, { method: "PATCH", cookie: alice, body: { parentId: top.id } })).status, 400);
  const del = await call(`/api/documents/${top.id}`, { method: "DELETE", cookie: alice });
  assert.equal(del.json.deleted, 3);
  assert.equal((await call(`/api/documents/${leaf.id}`, { cookie: alice })).status, 404);
});

test("tasks: create, validate, update and delete", async () => {
  const t = await call("/api/tasks", { method: "POST", cookie: alice, body: { name: "Ship it", priority: "High" } });
  assert.equal(t.status, 201);
  assert.equal((await call(`/api/tasks/${t.json.id}`, { method: "PATCH", cookie: alice, body: { progress: 150 } })).status, 400);
  const moved = await call(`/api/tasks/${t.json.id}`, { method: "PATCH", cookie: alice, body: { status: "Done", progress: 100 } });
  assert.equal(moved.json.status, "Done");
  assert.equal((await call(`/api/tasks/${t.json.id}`, { method: "PATCH", cookie: bob, body: { status: "Backlog" } })).status, 404);
  assert.equal((await call(`/api/tasks/${t.json.id}`, { method: "DELETE", cookie: alice })).status, 200);
});

test("the AI route needs a session and unknown API routes answer JSON 404", async () => {
  assert.equal((await call("/api/ai/transform", { method: "POST", body: { prompt: "hi" } })).status, 401);
  const missing = await call("/api/nothing-here", { cookie: alice });
  assert.equal(missing.status, 404);
  assert.ok(missing.json.error);
});

test("deleting an account needs the password and removes all its data", async () => {
  const bobId = (await call("/api/auth/me", { cookie: bob })).json.user.id;
  assert.equal((await call("/api/auth/me", { method: "DELETE", cookie: bob, body: { password: "wrong-pass" } })).status, 401);
  assert.equal((await call("/api/auth/me", { method: "DELETE", cookie: bob, body: { password: "correct-horse" } })).status, 200);
  const { Document } = await import("./models/Document.js");
  const { Task } = await import("./models/Task.js");
  assert.equal(await Document.countDocuments({ userId: bobId }), 0);
  assert.equal(await Task.countDocuments({ userId: bobId }), 0);
  assert.equal((await call("/api/documents", { cookie: bob })).status, 401, "a deleted account's cookie stops working everywhere");
});

test("forgot password: same reply for any email, and the reset link works once and signs out other devices", async () => {
  const cookie = (await register("reset@example.com")).cookie;
  const unknown = await call("/api/auth/forgot", { method: "POST", body: { email: "nobody@example.com" } });
  const known = await call("/api/auth/forgot", { method: "POST", body: { email: "reset@example.com" } });
  assert.equal(unknown.status, 200);
  assert.equal(unknown.json.message, known.json.message, "the reply does not reveal which emails exist");
  const mail = outbox.find((m) => m.to === "reset@example.com");
  assert.ok(mail, "an email was sent to the account");
  assert.ok(!outbox.some((m) => m.to === "nobody@example.com"));
  const token = mail.text.match(/reset=([A-Za-z0-9_-]+)/)[1];

  assert.equal((await call("/api/auth/reset", { method: "POST", body: { token, password: "short" } })).status, 400);
  const done = await call("/api/auth/reset", { method: "POST", body: { token, password: "a-brand-new-password" } });
  assert.equal(done.status, 200);
  assert.match(done.cookie, /^token=/);
  assert.equal((await call("/api/auth/me", { cookie })).status, 401, "the old session no longer works");
  assert.equal((await call("/api/auth/me", { cookie: done.cookie })).status, 200);
  assert.equal((await call("/api/auth/reset", { method: "POST", body: { token, password: "another-password-1" } })).status, 400, "a link works only once");
  assert.equal((await call("/api/auth/login", { method: "POST", body: { email: "reset@example.com", password: "a-brand-new-password" } })).status, 200);
});

test("repeated wrong passwords lock that email from that address, stored in the database", async () => {
  await register("locked@example.com");
  const attempt = (password) => call("/api/auth/login", { method: "POST", body: { email: "locked@example.com", password } });
  for (let i = 0; i < 8; i++) assert.equal((await attempt("wrong-password")).status, 401);
  assert.equal((await attempt("correct-horse")).status, 429, "even the right password waits once locked");
  const { LoginAttempt } = await import("./models/LoginAttempt.js");
  assert.equal((await LoginAttempt.findOne({ key: /^locked@example\.com\|/ }).lean()).count, 8);
});

test("share links: the owner turns sharing on and off, and the public view is read-only", async () => {
  const owner = (await register("sharer@example.com")).cookie;
  const doc = (await call("/api/documents", { method: "POST", cookie: owner, body: { title: "Roadmap", content: "<p>Ship in May</p>" } })).json;
  const stranger = (await register("stranger@example.com")).cookie;
  assert.equal((await call(`/api/documents/${doc.id}/share`, { method: "POST", cookie: stranger })).status, 404, "only the owner can share");
  const { shareId } = (await call(`/api/documents/${doc.id}/share`, { method: "POST", cookie: owner })).json;
  const view = await call(`/api/share/${shareId}`);
  assert.equal(view.status, 200);
  assert.deepEqual(Object.keys(view.json).sort(), ["content", "cover", "icon", "title", "updatedAt"]);
  assert.equal(view.json.title, "Roadmap");
  assert.equal((await call(`/api/documents/${doc.id}/share`, { method: "DELETE", cookie: owner })).status, 200);
  assert.equal((await call(`/api/share/${shareId}`)).status, 404, "turning sharing off breaks the old link");
  assert.equal((await call("/api/share/not-a-real-share-id-12345")).status, 404);
});
