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

test("notes -> tasks: a page's open to-dos become linked board cards, without AI", async () => {
  const { page, problems } = await newPage();
  await logIn(page);
  await page.locator("aside").getByText("Weekly sync: beta launch").first().click();
  await page.getByRole("button", { name: /create tasks/i }).first().click();

  const dialog = page.getByRole("dialog", { name: /create tasks from page/i });
  await dialog.getByText(/open to-dos only/i).waitFor(); // no Gemini key in tests
  const titles = await dialog.getByLabel("Task title").evaluateAll((els) => els.map((e) => e.value));
  assert.deepEqual(titles, ["Priya to redesign onboarding step 2 by Friday", "Arjun: run an A/B test without the workspace-name field"]);
  assert.match(await dialog.locator("li").first().innerText(), /Priya[\s\S]*Friday/, "owner and deadline read from the line");
  await dialog.getByRole("button", { name: /add 2 tasks/i }).click();
  await page.getByText("Added 2 tasks to the board").waitFor();
  await page.getByRole("button", { name: /2 tasks on the board/i }).click();

  // The board card links back to the page it came from.
  const card = page.locator("article", { hasText: "Priya to redesign onboarding" });
  await card.getByRole("button", { name: /weekly sync: beta launch/i }).click();
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Weekly sync: beta launch").waitFor();

  // Running it again shows them as already added.
  await page.getByRole("button", { name: /create tasks/i }).first().click();
  await dialog.getByText("Already on the board").first().waitFor();
  assert.equal(await dialog.getByRole("button", { name: /^add/i }).isDisabled(), true);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  assert.deepEqual(problems, []);
  await page.close();
});

test("ask your workspace: answers with sources from any page, and a citation opens the page", async () => {
  const { page, problems } = await newPage();
  await logIn(page);
  await page.getByRole("button", { name: /^copilot$/i }).click(); // from Home, so it asks about all pages
  const panel = page.getByRole("complementary", { name: "AI Copilot" });
  assert.equal(await panel.getByRole("tab", { name: "All pages" }).getAttribute("aria-selected"), "true");
  await panel.getByLabel("Ask Copilot").fill("When is the beta launch?");
  await panel.getByLabel("Ask Copilot").press("Enter");

  await panel.getByText("Sources", { exact: true }).waitFor({ timeout: 10000 });
  await panel.getByText(/28 November/).first().waitFor();
  assert.match(await panel.locator("ol").innerText(), /Weekly sync: beta launch/);
  await panel.locator(".doc-editor .cite").first().click();
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Weekly sync: beta launch").waitFor();

  // On a page, the switch can go back to editing just that page.
  await panel.getByRole("tab", { name: "This page" }).click();
  assert.equal(await panel.getByRole("tab", { name: "This page" }).getAttribute("aria-selected"), "true");
  assert.deepEqual(problems, []);
  await page.close();
});

test("the / menu keeps up with fast typing, filters, inserts, and stays above the bottom edge", async () => {
  const { page, problems } = await newPage({ width: 1366, height: 700 });
  await logIn(page);
  await page.locator("main button.btn-primary", { hasText: "New page" }).click();
  await page.getByPlaceholder("Untitled").fill("Slash test");
  const editor = page.locator(".ProseMirror");
  await editor.click();

  // Typed in one burst, with no pause after the "/".
  await page.keyboard.type("/bul", { delay: 0 });
  const menu = page.locator("[data-slash-menu]");
  await menu.waitFor({ timeout: 2000 });
  assert.match(await menu.innerText(), /Bulleted list/);
  await page.keyboard.press("Enter");
  await page.keyboard.type("first item");
  assert.equal(await editor.locator("ul li").count(), 1);
  assert.equal(await menu.count(), 0);

  // Escape closes it and further typing on that line does not reopen it.
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  await menu.waitFor();
  await page.keyboard.press("Escape");
  await page.keyboard.type("x");
  assert.equal(await menu.count(), 0);

  // Near the bottom of the window the menu opens upward and stays fully on screen.
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  for (let i = 0; i < 14; i++) await page.keyboard.press("Enter");
  await page.keyboard.type("/");
  await menu.waitFor();
  const box = await menu.boundingBox();
  const caretTop = await page.evaluate(() => getSelection().getRangeAt(0).getBoundingClientRect().top);
  assert.ok(caretTop > 700 / 2, "the line should be in the lower half of the window for this check");
  assert.ok(box && box.y >= 0 && box.y + box.height <= caretTop + 1, `menu should open upward and stay on screen, got ${JSON.stringify(box)} with the line at ${caretTop}`);
  await page.keyboard.press("Escape");

  assert.deepEqual(problems, []);
  await page.close();
});
