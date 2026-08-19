import { Hono } from "hono";
import type { Env } from "../types";
import {
  checkRateLimit,
  clearFailedAttempts,
  clearSession,
  createSession,
  getClientIp,
  isAuthed,
  passphraseMatches,
  recordFailedAttempt,
} from "../auth";

const app = new Hono<{ Bindings: Env }>();

app.post("/login", async (c) => {
  const ip = getClientIp(c);
  const rate = await checkRateLimit(c.env, ip);
  if (!rate.allowed) {
    return c.json(
      { error: `Too many attempts. Try again in ${rate.retryAfterSeconds}s.` },
      429,
    );
  }

  const body = await c.req.json().catch(() => null);
  const passphrase = typeof body?.passphrase === "string" ? body.passphrase : "";

  if (!(await passphraseMatches(c.env, passphrase))) {
    await recordFailedAttempt(c.env, ip);
    return c.json({ error: "Invalid passphrase" }, 401);
  }

  await clearFailedAttempts(c.env, ip);
  await createSession(c);
  return c.json({ ok: true });
});

app.post("/logout", async (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

app.get("/session", async (c) => {
  return c.json({ authed: await isAuthed(c) });
});

export default app;
