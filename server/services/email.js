import { IS_PROD } from "../config.js";

/**
 * Sends one email through Resend's HTTP API when RESEND_API_KEY is set.
 * Without a key, development prints the email to the console so the flow can be tried locally,
 * and production logs a warning (the user still sees the same "check your inbox" message).
 */
let transport = async ({ to, subject, text }) => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (IS_PROD) console.warn("RESEND_API_KEY is not set, so no email was sent.");
    else console.log(`\n--- email to ${to} ---\n${subject}\n\n${text}\n---\n`);
    return { sent: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "CogniSpace <onboarding@resend.dev>", to: [to], subject, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Email provider returned ${res.status}`);
  return { sent: true };
};

export const sendEmail = (message) => transport(message);

/** Tests swap the transport to capture emails instead of sending them. */
export const setEmailTransport = (fn) => { transport = fn; };
