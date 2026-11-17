// Notes -> tasks and Ask your workspace, without a database or Gemini. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { pageBlocks, pagePlainText } from "../lib/pageText.js";
import { todosFromHtml, cleanAiItems, mergeSuggestions, readOwnerAndDue } from "../services/pageTasks.service.js";
import { buildChunks, searchChunks, askWorkspace, tokenize, clipWords } from "../services/workspaceAsk.service.js";

const MEETING = `<h2>Decisions</h2><ul><li><p>We launch the public beta on <strong>28 November</strong>, not the 21st.</p></li>
<li><p>Pricing stays free during the beta.</p></li></ul>
<h2>Action items</h2><ul data-type="taskList">
<li data-type="taskItem" data-checked="false"><label><input type="checkbox"></label><div><p>Priya to redesign onboarding step 2 by Friday</p></div></li>
<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Set up the shared support inbox</p></div></li>
</ul><pre><code>const secret = "not a task";</code></pre><p>Tom &amp; Ana will email the vendor.</p>`;

test("page blocks keep headings, to-dos with their state, and decode entities", () => {
  const blocks = pageBlocks(MEETING);
  assert.deepEqual(blocks.filter((b) => b.type === "heading").map((b) => b.text), ["Decisions", "Action items"]);
  const todos = blocks.filter((b) => b.type === "todo");
  assert.deepEqual(todos.map((t) => [t.text, t.checked]), [["Priya to redesign onboarding step 2 by Friday", false], ["Set up the shared support inbox", true]]);
  assert.ok(blocks.some((b) => b.text === "Tom & Ana will email the vendor."));
  assert.equal(blocks.find((b) => /launch/.test(b.text)).heading, "Decisions");
  assert.doesNotMatch(pagePlainText(MEETING), /not a task/, "code blocks are left out");
});

test("only unchecked to-dos become suggestions without AI, keeping the owner and deadline written in them", () => {
  const todos = todosFromHtml(MEETING);
  assert.deepEqual(todos.map((t) => [t.title, t.assignee, t.due]), [["Priya to redesign onboarding step 2 by Friday", "Priya", "Friday"]]);
});

test("owner and deadline are read from common ways of writing them, and not invented", () => {
  assert.deepEqual(readOwnerAndDue("Arjun: run an A/B test"), { assignee: "Arjun", due: "" });
  assert.deepEqual(readOwnerAndDue("Ana Silva will send the invoice by 21 Nov"), { assignee: "Ana Silva", due: "21 Nov" });
  assert.deepEqual(readOwnerAndDue("Ravi should fix login before next Monday"), { assignee: "Ravi", due: "Next Monday" });
  assert.deepEqual(readOwnerAndDue("We will ship by end of the week"), { assignee: "", due: "End of the week" });
  assert.deepEqual(readOwnerAndDue("compress the hero video"), { assignee: "", due: "" });
});

test("no stray space before punctuation after bold text", () => {
  assert.match(pagePlainText("<p>On <strong>28 November</strong>, not later.</p>"), /On 28 November, not later\./);
});

test("AI items are cleaned: bad entries dropped, unknown priority becomes Medium, long text clipped", () => {
  const items = cleanAiItems([{ title: "  Email the vendor ", assignee: "Tom", due: "Monday", priority: "Critical" }, { title: "" }, null, { nope: 1 }, { title: "x".repeat(500), priority: "High" }]);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], { title: "Email the vendor", assignee: "Tom", due: "Monday", priority: "Medium", source: "ai" });
  assert.equal(items[1].title.length, 200);
  assert.deepEqual(cleanAiItems("not an array"), []);
});

test("merging prefers AI detail, drops near-duplicates and flags tasks already on the board", () => {
  const todos = [{ title: "Redesign onboarding step 2", source: "todo" }, { title: "Set up analytics", source: "todo" }];
  const ai = [{ title: "Redesign onboarding step 2 by Friday", assignee: "Priya", source: "ai" }, { title: "Email the vendor", source: "ai" }];
  const out = mergeSuggestions(todos, ai, ["email the vendor!"]);
  assert.deepEqual(out.map((o) => o.title), ["Redesign onboarding step 2 by Friday", "Email the vendor", "Set up analytics"]);
  assert.equal(out[0].assignee, "Priya");
  assert.equal(out.find((o) => o.title === "Email the vendor").exists, true);
  assert.equal(out.find((o) => o.title === "Set up analytics").exists, false);
});

const DOCS = [
  { _id: "a1", title: "Weekly sync", content: MEETING },
  { _id: "b2", title: "Hiring plan", content: "<h2>Roles</h2><p>We are hiring two backend engineers in Hyderabad this quarter.</p>" },
  { _id: "c3", title: "Recipes", content: "<p>Chai: boil milk with ginger and cardamom.</p>" },
];

test("search finds the right page and passage, and filler words don't match", () => {
  const chunks = buildChunks(DOCS);
  const { results, coverage } = searchChunks(chunks, "When is the beta launch?", 3);
  assert.equal(results[0].documentId, "a1");
  assert.match(results[0].text, /28 November/);
  assert.equal(coverage, 1);
  assert.equal(searchChunks(chunks, "who are we hiring", 3).results[0].title, "Hiring plan");
  assert.equal(searchChunks(chunks, "what is the", 3).results.length, 0, "only stop words: no results");
  assert.deepEqual(tokenize("Launching, launched and LAUNCH"), ["launch", "launch", "launch"], "word forms match each other");
});

test("ask: answers from sources with citations, sources sent first", async () => {
  const events = [];
  let prompt = "";
  const r = await askWorkspace({
    question: "When is the beta launch?",
    loadDocs: async () => DOCS,
    onSources: (s) => events.push(["sources", s]),
    onText: (t) => events.push(["text", t]),
    stream: async ({ contents, onText }) => { prompt = contents; onText("<p>On 28 November [1].</p>"); },
  });
  assert.equal(r.found, true);
  assert.equal(events[0][0], "sources");
  assert.equal(events[0][1][0].documentId, "a1");
  assert.equal(events[0][1][0].n, 1);
  assert.match(prompt, /\[1\] Page "Weekly sync", section "Decisions"/);
  assert.deepEqual(events[1], ["text", "<p>On 28 November [1].</p>"]);
});

test("ask: says it found nothing instead of guessing, without calling the AI", async () => {
  let called = false;
  const texts = [];
  const r = await askWorkspace({
    question: "What is our Kubernetes budget?",
    loadDocs: async () => DOCS,
    onSources: (s) => assert.deepEqual(s, []),
    onText: (t) => texts.push(t),
    stream: async () => { called = true; },
  });
  assert.equal(r.found, false);
  assert.equal(called, false);
  assert.match(texts.join(""), /couldn't find anything/);
});

test("ask: when the AI is down it still shows the best passages, escaped", async () => {
  const texts = [];
  const r = await askWorkspace({
    question: "who will email the vendor",
    loadDocs: async () => DOCS,
    onSources: () => {},
    onText: (t) => texts.push(t),
    stream: async () => { const e = new Error("x"); e.kind = "quota"; throw e; },
  });
  assert.equal(r.ai, "quota");
  const html = texts.join("");
  assert.match(html, /usage limit/);
  assert.match(html, /Tom &amp; Ana will email the vendor\. \[1\]/);
  assert.doesNotMatch(html, /Pricing stays free/, "only the line that matches, not the whole section");
  assert.doesNotMatch(html, /<script/);
});

test("long snippets are cut at a word, never mid-word", () => {
  const cut = clipWords("alpha beta gamma delta epsilon ".repeat(20), 50);
  assert.ok(cut.endsWith("…"));
  assert.ok(cut.length <= 51);
  assert.match(cut, /[a-z]…$/);
  assert.equal(clipWords("short text", 50), "short text");
});
