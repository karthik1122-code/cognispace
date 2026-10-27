// End-to-end journey in a real browser against the real server and an embedded MongoDB.
// Needs a production build first:  npm run build && npm run test:e2e
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 4100 + Math.floor(Math.random() * 800);
const BASE = `http://127.0.0.1:${PORT}`;
let server, browser;

test.before(async () => {
  server = spawn(process.execPath, ["server/server.js"], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "development", MONGODB_URI: "", GEMINI_API_KEY: "" },
    stdio: ["ignore", "pipe", "inherit"],
  });
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

async function newPage(viewport = { width: 1366, height: 850 }) {
  const page = await browser.newPage({ viewport });
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });
  return { page, problems };
}

const email = `e2e-${Date.now()}@example.com`;
const password = "a-long-password";

test("sign up, write a page, and it is still there after a reload", async () => {
  const { page, problems } = await newPage();
  await page.goto(BASE);
  await page.getByRole("button", { name: /start building free/i }).click();
  await page.getByRole("heading", { name: /create your workspace/i }).waitFor();

  await page.getByRole("button", { name: /^create account$/i }).click();
  await page.getByText("Enter your name").waitFor(); // client-side validation

  await page.getByLabel("Name").fill("Ada Test");
  await page.getByLabel("Email").fill(email);
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: /^create account$/i }).click();
  await page.getByRole("heading", { name: /Ada\./ }).waitFor({ timeout: 15000 });

  await page.locator("main button.btn-primary", { hasText: "New page" }).click();
  await page.getByPlaceholder("Untitled").fill("Launch checklist");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Ship the onboarding flow by Friday.");
  await page.waitForTimeout(1500); // autosave debounce
  await page.getByText("Saved").first().waitFor();

  await page.reload();
  await page.locator("aside").getByText("Launch checklist").first().click();
  assert.match(await page.locator(".ProseMirror").innerText(), /onboarding flow/);
  assert.deepEqual(problems, []);
  await page.close();
});

test("a task can be moved to Done without dragging, and the move is saved", async () => {
  const { page, problems } = await newPage();
  await logIn(page);
  await page.locator("aside").getByRole("button", { name: /sprint board/i }).click();
  const backlog = page.locator('section[aria-label="Backlog"]');
  const first = backlog.locator("article").first();
  const name = await first.getByLabel("Task name").inputValue();
  await first.getByRole("button", { name: /change status/i }).click();
  await page.getByRole("menuitem", { name: "Done" }).click();
  await page.waitForTimeout(800);

  await page.reload();
  await page.locator("aside").getByRole("button", { name: /sprint board/i }).click();
  const doneNames = await page.locator('section[aria-label="Done"] textarea').evaluateAll((els) => els.map((e) => e.value));
  assert.ok(doneNames.includes(name), `"${name}" should be in Done`);
  assert.deepEqual(problems, []);
  await page.close();
});

async function logIn(page) {
  await page.goto(BASE);
  await page.getByRole("button", { name: /^log in$/i }).first().click();
  await page.getByLabel("Email").fill(email);
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: /^log in$/i }).last().click();
  await page.getByRole("heading", { name: /Ada\./ }).waitFor({ timeout: 15000 });
}

test("command palette finds a page, and logging out ends the session", async () => {
  const { page, problems } = await newPage();
  await logIn(page);
  await page.keyboard.press("Control+k");
  await page.keyboard.type("Launch");
  await page.keyboard.press("Enter");
  await page.getByPlaceholder("Untitled").waitFor();
  assert.equal(await page.getByPlaceholder("Untitled").inputValue(), "Launch checklist");

  await page.locator("aside").getByText("Ada Test").click();
  await page.getByRole("menuitem", { name: /log out/i }).click();
  await page.getByRole("button", { name: /start building free/i }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: /start building free/i }).waitFor(); // still signed out
  assert.deepEqual(problems, []);
  await page.close();
});

test("the landing page fits a phone screen", async () => {
  const { page, problems } = await newPage({ width: 390, height: 844 });
  await page.goto(BASE);
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `page is ${overflow}px wider than the screen`);
  assert.deepEqual(problems, []);
  await page.close();
});
