// Sharing and password reset in a real browser. Needs a production build first.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4900 + Math.floor(Math.random() * 800);
const BASE = `http://127.0.0.1:${PORT}`;
let server, browser, log = "";

test.before(async () => {
  server = spawn(process.execPath, ["server/server.js"], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", MONGODB_URI: "", GEMINI_API_KEY: "", RESEND_API_KEY: "", APP_URL: BASE, CORS_ORIGINS: BASE },
    stdio: ["ignore", "pipe", "inherit"],
  });
  server.stdout.on("data", (d) => { log += d.toString(); });
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(`${BASE}/health`)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
});

test.after(async () => {
  await browser?.close();
  server?.kill();
});

const email = `share-${Date.now()}@example.com`;
const password = "first-long-password";

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });
  return { page, problems };
}

test("a page shared by link can be read signed out, and stops working when unshared", async () => {
  const { page, problems } = await newPage();
  await page.goto(BASE);
  await page.getByRole("button", { name: /start building free/i }).click();
  await page.getByLabel("Name").fill("Grace Test");
  await page.getByLabel("Email").fill(email);
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: /^create account$/i }).click();
  await page.getByRole("heading", { name: /Grace\./ }).waitFor({ timeout: 15000 });

  await page.locator("main button.btn-primary", { hasText: "New page" }).click();
  await page.getByPlaceholder("Untitled").fill("Public notes");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Anyone with the link can read this.");
  await page.waitForTimeout(1500);
  await page.getByText("Saved").first().waitFor();

  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("menuitem", { name: /share read-only link/i }).click();
  await page.getByRole("button", { name: "Create link" }).click();
  const link = await page.getByLabel("Share link").inputValue();
  assert.match(link, /\/s\/[A-Za-z0-9_-]{20,}$/);

  const reader = await browser.newContext();
  const rp = await reader.newPage();
  await rp.goto(link);
  await rp.getByText("Anyone with the link can read this.").waitFor();
  assert.equal(await rp.locator(".ProseMirror").count(), 0, "shared page must not be editable");

  await page.getByRole("button", { name: "Stop sharing" }).click();
  await page.getByRole("button", { name: "Create link" }).waitFor();
  await rp.reload();
  await rp.getByText(/does not work any more/i).first().waitFor();
  await reader.close();
  assert.deepEqual(problems, []);
  await page.close();
});

test("forgot password sends a link that sets a new password and signs in", async () => {
  const { page, problems } = await newPage();
  await page.goto(BASE);
  await page.getByRole("button", { name: /^log in$/i }).first().click();
  await page.getByRole("button", { name: /forgot password/i }).click();
  await page.getByRole("heading", { name: /reset your password/i }).waitFor();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: /send reset link/i }).click();
  await page.getByRole("status").getByText(/reset link is on its way/i).waitFor();

  let url;
  for (let i = 0; i < 20 && !url; i++) {
    url = log.match(/https?:\/\/\S+\?reset=[A-Za-z0-9_-]+/)?.[0];
    if (!url) await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(url, "reset link should be printed in development");

  await page.goto(url);
  const fields = page.locator("input[type=password]");
  await fields.nth(0).fill("second-long-password");
  await fields.nth(1).fill("second-long-password");
  await page.getByRole("button", { name: /save new password/i }).click();
  await page.getByRole("heading", { name: /Grace\./ }).waitFor({ timeout: 15000 });

  // The link is single-use.
  const again = await fetch(`${BASE}/api/auth/reset`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: new URL(url).searchParams.get("reset"), password: "third-long-password" }),
  });
  assert.equal(again.status, 400);
  assert.deepEqual(problems, []);
  await page.close();
});
