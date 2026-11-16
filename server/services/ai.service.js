// Gemini access for the Copilot: picks a model, fails fast with a clear reason, and falls back
// to a lighter model when the main one is slow, overloaded or out of quota.

export const DEFAULT_MODEL = "gemini-3.8-flash";
export const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash-lite";

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

export function aiSettings(env = process.env) {
  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallback = env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  return {
    apiKey: env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 10 ? env.GEMINI_API_KEY : null,
    models: fallback && fallback !== model ? [model, fallback] : [model],
    firstTokenMs: num(env.AI_FIRST_TOKEN_MS, 15000), // time allowed until the first words arrive
    idleMs: num(env.AI_IDLE_MS, 15000),              // longest gap allowed between chunks
    budgetMs: num(env.AI_BUDGET_MS, 35000),          // total time across all attempts before giving up
  };
}

let clientFactory = async (apiKey) => {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey });
};
export function setAiClientFactory(factory) { clientFactory = factory; }

const MESSAGES = {
  not_configured: "AI is not set up on this server yet.",
  key_invalid: "The server's Gemini API key is invalid or expired.",
  key_denied: "The server's Gemini API key is not allowed to use this model.",
  quota: "The AI has hit its usage limit for now. Please try again in a few minutes.",
  model_not_found: "The configured AI model is not available.",
  overloaded: "The AI is busy right now. Please try again in a moment.",
  timeout: "The AI took too long to answer. Please try again.",
  blocked: "The AI declined to answer this request.",
  unknown: "The AI service is unavailable right now. Please try again.",
};
export const aiMessage = (kind) => MESSAGES[kind] || MESSAGES.unknown;

// Turns any SDK or network error into one of the kinds above.
export function classifyAiError(err) {
  if (err?.kind) return err.kind;
  const status = Number(err?.status || err?.code || 0);
  const msg = String(err?.message || err || "");
  if (/API[_ ]?KEY[_ ]?INVALID|API key not valid|API key expired|invalid api key/i.test(msg)) return "key_invalid";
  if (/thinking/i.test(msg) && (status === 400 || /INVALID_ARGUMENT/.test(msg))) return "thinking_unsupported";
  if (status === 401 || status === 403 || /PERMISSION_DENIED|UNAUTHENTICATED/i.test(msg)) return "key_denied";
  if (status === 404 || /NOT_FOUND|is not found|not supported for generateContent/i.test(msg)) return "model_not_found";
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) return "quota";
  if (status >= 500 || /UNAVAILABLE|overloaded|high demand|INTERNAL/i.test(msg)) return "overloaded";
  if (/timed out|timeout|ETIMEDOUT|ECONNRESET|fetch failed|aborted/i.test(msg)) return "timeout";
  if (/SAFETY|blocked/i.test(msg)) return "blocked";
  return "unknown";
}

// These mean the same request will fail on any model, so stop instead of trying the fallback.
const FATAL = new Set(["not_configured", "key_invalid", "blocked"]);

class TimedOut extends Error {
  constructor(label) { super(`${label} timed out`); this.kind = "timeout"; }
}

function withTimeout(promise, ms, label, onTimeout) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => { onTimeout?.(); reject(new TimedOut(label)); }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Streams a Gemini answer. Calls onText for each chunk. Returns { model, kind: "ok" } or throws an
 * Error with .kind set. Once any text has been sent it never switches model (no mixed answers).
 */
export async function streamGemini({ contents, systemInstruction, onText, signal, settings = aiSettings(), log = console }) {
  if (!settings.apiKey) { const e = new Error("not configured"); e.kind = "not_configured"; throw e; }
  const ai = await clientFactory(settings.apiKey);
  const started = Date.now();
  let lastKind = "timeout"; // if the time budget runs out before any answer

  for (const model of settings.models) {
    let useThinking = true;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const left = settings.budgetMs - (Date.now() - started);
      if (left < 500 || signal?.aborted) break;
      const ac = new AbortController();
      const stopOnClientAbort = () => ac.abort();
      signal?.addEventListener("abort", stopOnClientAbort, { once: true });
      let sentText = false;
      try {
        const config = {
          systemInstruction,
          temperature: 0.3,
          abortSignal: ac.signal,
          // Newer Flash models "think" before the first word; for edits and summaries that only adds delay.
          ...(useThinking ? { thinkingConfig: { thinkingLevel: "MINIMAL" } } : {}),
        };
        // The first words must arrive by this time; after that only gaps between chunks are limited.
        const firstDeadline = Date.now() + Math.min(settings.firstTokenMs, left);
        const untilFirst = () => Math.max(500, firstDeadline - Date.now());
        const stream = await withTimeout(
          ai.models.generateContentStream({ model, contents, config }),
          untilFirst(), "Gemini first response", () => ac.abort()
        );
        const it = stream[Symbol.asyncIterator]();
        while (true) {
          const { value, done } = await withTimeout(it.next(), sentText ? settings.idleMs : untilFirst(), "Gemini stream", () => ac.abort());
          if (done) break;
          const text = value?.text;
          if (text) { sentText = true; onText(text); }
        }
        if (!sentText) { const e = new Error("empty answer"); e.kind = "blocked"; throw e; }
        return { model, kind: "ok", ms: Date.now() - started };
      } catch (err) {
        const kind = classifyAiError(err);
        lastKind = kind === "thinking_unsupported" ? lastKind : kind;
        log.warn?.(`[AI] ${model} attempt ${attempt} failed: ${kind} (status ${err?.status ?? "-"}) ${String(err?.message || "").slice(0, 200)}`);
        if (signal?.aborted) { const e = new Error("client left"); e.kind = "timeout"; throw e; }
        if (sentText) { const e = new Error("stream broke"); e.kind = kind; e.partial = true; throw e; }
        if (kind === "thinking_unsupported") { useThinking = false; attempt--; continue; }
        if (FATAL.has(kind)) { const e = new Error(kind); e.kind = kind; throw e; }
        if (kind !== "overloaded") break; // quota, missing model, timeout, denied: go straight to the fallback model
        await new Promise((r) => setTimeout(r, 600));
      } finally {
        signal?.removeEventListener("abort", stopOnClientAbort);
      }
    }
  }
  const e = new Error(lastKind);
  e.kind = lastKind;
  throw e;
}

// One tiny request, cached, so anyone can see whether the Copilot works and why not, without logs.
let statusCache = { at: 0, value: null };
export async function aiStatus({ settings = aiSettings(), now = Date.now(), cacheMs = 120000 } = {}) {
  if (statusCache.value && now - statusCache.at < cacheMs) return { ...statusCache.value, cached: true };
  const base = { configured: Boolean(settings.apiKey), models: settings.models, checkedAt: new Date(now).toISOString() };
  let value;
  if (!settings.apiKey) {
    value = { ...base, ok: false, kind: "not_configured", message: aiMessage("not_configured") };
  } else {
    try {
      const r = await streamGemini({ contents: "Reply with the single word OK.", systemInstruction: "Answer in one word.", onText: () => {}, settings: { ...settings, budgetMs: Math.min(settings.budgetMs, 25000) }, log: { warn: () => {} } });
      value = { ...base, ok: true, kind: "ok", model: r.model, latencyMs: r.ms };
    } catch (err) {
      value = { ...base, ok: false, kind: err.kind || "unknown", message: aiMessage(err.kind) };
    }
  }
  statusCache = { at: now, value };
  return value;
}
export function resetAiStatusCache() { statusCache = { at: 0, value: null }; }
