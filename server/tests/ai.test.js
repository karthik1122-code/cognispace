// Copilot model handling, with a fake Gemini client. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { streamGemini, classifyAiError, setAiClientFactory, aiStatus, resetAiStatusCache, aiMessage, resetModelHealth } from "../services/ai.service.js";

const settings = (over = {}) => ({ apiKey: "test-key-123456", models: ["main-model", "lite-model"], firstTokenMs: 300, idleMs: 300, budgetMs: 3000, ...over });
const quiet = { warn: () => {} };
const apiError = (status, message) => Object.assign(new Error(message), { status });

async function* chunks(...texts) { for (const text of texts) yield { text }; }

// behaviour(model, config, callNumber) returns a stream, throws, or hangs.
function fakeGemini(behaviour) {
  resetModelHealth();
  const calls = [];
  setAiClientFactory(async () => ({
    models: {
      generateContentStream: async ({ model, config }) => {
        calls.push({ model, thinking: Boolean(config.thinkingConfig) });
        return behaviour(model, config, calls.length);
      },
    },
  }));
  return calls;
}

async function run(s = settings()) {
  const out = [];
  const r = await streamGemini({ contents: "hi", systemInstruction: "x", onText: (t) => out.push(t), settings: s, log: quiet });
  return { r, text: out.join("") };
}

test("streams the answer from the main model with minimal thinking", async () => {
  const calls = fakeGemini(() => chunks("<p>Hello", " there</p>"));
  const { r, text } = await run();
  assert.equal(text, "<p>Hello there</p>");
  assert.equal(r.model, "main-model");
  assert.deepEqual(calls, [{ model: "main-model", thinking: true }]);
});

test("an invalid key stops at once with a clear reason, no fallback", async () => {
  const calls = fakeGemini(() => { throw apiError(400, "API key not valid. Please pass a valid API key. [API_KEY_INVALID]"); });
  await assert.rejects(run(), (e) => e.kind === "key_invalid");
  assert.equal(calls.length, 1);
});

test("a missing model falls back to the lite model", async () => {
  const calls = fakeGemini((model) => {
    if (model === "main-model") throw apiError(404, "models/main-model is not found for API version v1beta");
    return chunks("ok");
  });
  const { r } = await run();
  assert.equal(r.model, "lite-model");
  assert.deepEqual(calls.map((c) => c.model), ["main-model", "lite-model"]);
});

test("used-up quota on the main model falls back to the lite model", async () => {
  fakeGemini((model) => {
    if (model === "main-model") throw apiError(429, "RESOURCE_EXHAUSTED: quota exceeded");
    return chunks("ok");
  });
  assert.equal((await run()).r.model, "lite-model");
});

test("a hanging model times out fast and the fallback answers", async () => {
  fakeGemini((model) => (model === "main-model" ? new Promise(() => {}) : chunks("fast")));
  const t0 = Date.now();
  const { r, text } = await run();
  assert.equal(r.model, "lite-model");
  assert.equal(text, "fast");
  assert.ok(Date.now() - t0 < 1500, "should not wait long on the hung model");
});

test("a stream that opens but never sends words also times out", async () => {
  fakeGemini((model) => (model === "main-model" ? { [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }) } : chunks("ok")));
  assert.equal((await run()).r.model, "lite-model");
});

test("when every model hangs it gives up within the budget", async () => {
  fakeGemini(() => new Promise(() => {}));
  const t0 = Date.now();
  await assert.rejects(run(settings({ budgetMs: 1200 })), (e) => e.kind === "timeout");
  assert.ok(Date.now() - t0 < 2500);
});

test("a model that rejects the thinking setting is retried without it", async () => {
  const calls = fakeGemini((_m, config) => {
    if (config.thinkingConfig) throw apiError(400, "INVALID_ARGUMENT: thinking level is not supported for this model");
    return chunks("ok");
  });
  const { r } = await run();
  assert.equal(r.model, "main-model");
  assert.deepEqual(calls.map((c) => c.thinking), [true, false]);
});

test("an overloaded model is retried once before falling back", async () => {
  const calls = fakeGemini((_m, _c, n) => (n === 1 ? (() => { throw apiError(503, "UNAVAILABLE: high demand"); })() : chunks("ok")));
  const { r } = await run();
  assert.equal(r.model, "main-model");
  assert.equal(calls.length, 2);
});

test("an answer that breaks halfway never switches model", async () => {
  async function* broken() { yield { text: "half" }; throw apiError(503, "UNAVAILABLE"); }
  const calls = fakeGemini(() => broken());
  const out = [];
  await assert.rejects(
    streamGemini({ contents: "hi", systemInstruction: "x", onText: (t) => out.push(t), settings: settings(), log: quiet }),
    (e) => e.partial === true
  );
  assert.equal(out.join(""), "half");
  assert.equal(calls.length, 1);
});

test("no key means not configured, without calling Gemini", async () => {
  const calls = fakeGemini(() => chunks("x"));
  await assert.rejects(run(settings({ apiKey: null })), (e) => e.kind === "not_configured");
  assert.equal(calls.length, 0);
});

test("errors are classified into plain reasons", () => {
  assert.equal(classifyAiError(apiError(400, "API key expired. Please renew the API key.")), "key_invalid");
  assert.equal(classifyAiError(apiError(403, "PERMISSION_DENIED")), "key_denied");
  assert.equal(classifyAiError(apiError(429, "Too many requests")), "quota");
  assert.equal(classifyAiError(apiError(503, "The model is overloaded")), "overloaded");
  assert.equal(classifyAiError(new Error("fetch failed")), "timeout");
  assert.match(aiMessage("quota"), /usage limit/);
});

test("the status check reports the reason and is cached", async () => {
  resetAiStatusCache();
  const calls = fakeGemini(() => { throw apiError(400, "API_KEY_INVALID"); });
  const s1 = await aiStatus({ settings: settings(), now: 1000 });
  assert.equal(s1.ok, false);
  assert.equal(s1.kind, "key_invalid");
  assert.equal(JSON.stringify(s1).includes("test-key"), false, "never reveals the key");
  const s2 = await aiStatus({ settings: settings(), now: 2000 });
  assert.equal(s2.cached, true);
  assert.equal(calls.length, 1);
  resetAiStatusCache();
});

test("after the main model times out, the next request skips it and answers at once", async () => {
  const calls = fakeGemini((model) => (model === "main-model" ? new Promise(() => {}) : chunks("ok")));
  await run();
  const t0 = Date.now();
  const { r } = await run();
  assert.equal(r.model, "lite-model");
  assert.ok(Date.now() - t0 < 200, "second request should not wait on the slow model");
  assert.deepEqual(calls.map((c) => c.model), ["main-model", "lite-model", "lite-model"]);
});

test("if every model failed recently, it still tries them all", async () => {
  let fail = true;
  const calls = fakeGemini((model) => (fail ? (() => { throw apiError(429, "quota"); })() : chunks(model)));
  await assert.rejects(run(), (e) => e.kind === "quota");
  fail = false;
  const { r } = await run();
  assert.equal(r.model, "main-model");
  assert.equal(calls.length, 3);
});
