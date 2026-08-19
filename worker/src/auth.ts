import type { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Env } from "./types";

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

const enc = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Constant-time passphrase check: instead of comparing strings with `===`
 * (which short-circuits on the first mismatched byte, leaking timing info),
 * we ask crypto.subtle.verify whether HMAC(secret, provided) matches a
 * precomputed HMAC(secret, expected) — an internally constant-time compare.
 */
export async function passphraseMatches(env: Env, provided: string): Promise<boolean> {
  const key = await getHmacKey(env.SESSION_SECRET);
  const expectedSig = await crypto.subtle.sign("HMAC", key, enc.encode(env.APP_PASSPHRASE));
  return crypto.subtle.verify("HMAC", key, expectedSig, enc.encode(provided));
}

async function signSessionValue(env: Env, exp: number): Promise<string> {
  const key = await getHmacKey(env.SESSION_SECRET);
  const payload = JSON.stringify({ exp });
  const payloadB64 = toBase64Url(enc.encode(payload).buffer as ArrayBuffer);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  return `${payloadB64}.${toBase64Url(sig)}`;
}

async function verifySessionValue(env: Env, value: string): Promise<boolean> {
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  const key = await getHmacKey(env.SESSION_SECRET);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sigB64),
    enc.encode(payloadB64),
  );
  if (!valid) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function createSession(c: Context<{ Bindings: Env }>): Promise<void> {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const value = await signSessionValue(c.env, exp);
  setCookie(c, SESSION_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSession(c: Context<{ Bindings: Env }>): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export async function isAuthed(c: Context<{ Bindings: Env }>): Promise<boolean> {
  const value = getCookie(c, SESSION_COOKIE);
  if (!value) return false;
  return verifySessionValue(c.env, value);
}

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  if (!(await isAuthed(c))) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
}

export function getClientIp(c: Context<{ Bindings: Env }>): string {
  return c.req.header("CF-Connecting-IP") ?? "unknown";
}

interface RateLimitStatus {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export async function checkRateLimit(env: Env, ip: string): Promise<RateLimitStatus> {
  const row = await env.DB.prepare(
    "SELECT fail_count, locked_until_ms FROM login_attempts WHERE ip = ?",
  )
    .bind(ip)
    .first<{ fail_count: number; locked_until_ms: number }>();
  if (!row) return { allowed: true };
  const now = Date.now();
  if (row.locked_until_ms > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((row.locked_until_ms - now) / 1000) };
  }
  return { allowed: true };
}

export async function recordFailedAttempt(env: Env, ip: string): Promise<void> {
  const now = Date.now();
  const row = await env.DB.prepare("SELECT fail_count FROM login_attempts WHERE ip = ?")
    .bind(ip)
    .first<{ fail_count: number }>();
  const failCount = (row?.fail_count ?? 0) + 1;
  const lockedUntil = failCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_SECONDS * 1000 : 0;
  await env.DB.prepare(
    `INSERT INTO login_attempts (ip, fail_count, last_attempt_ms, locked_until_ms)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(ip) DO UPDATE SET fail_count = ?, last_attempt_ms = ?, locked_until_ms = ?`,
  )
    .bind(ip, failCount, now, lockedUntil, failCount, now, lockedUntil)
    .run();
}

export async function clearFailedAttempts(env: Env, ip: string): Promise<void> {
  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
}
