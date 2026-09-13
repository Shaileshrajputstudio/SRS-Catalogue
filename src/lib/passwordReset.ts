import "server-only";
import crypto from "crypto";
import { r2GetText, r2Put, r2Del } from "./r2";
import { blobSecretNamespace } from "./blobConfig";

// A one-time reset token for the "Forgot password" flow, stored the same
// way as the password itself — a small blob at an unguessable path (see
// blobConfig.ts), no database. Kept separate from adminPassword.ts since
// a token has its own shape (value + expiry) and lifecycle (single-use,
// short-lived). The token value itself is also a 256-bit random secret,
// so even a leaked pathname alone doesn't let anyone reset the password
// — they'd still need the token that's only ever sent by email.
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function tokenPathname(): string {
  return `config/${blobSecretNamespace()}/reset-token.json`;
}

type ResetToken = { token: string; expiresAt: number };

export async function createResetToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const payload: ResetToken = { token, expiresAt: Date.now() + TOKEN_TTL_MS };
  await r2Put(tokenPathname(), JSON.stringify(payload), "application/json");
  return token;
}

export async function verifyResetToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const text = await r2GetText(tokenPathname());
    if (text === null) return false;
    const { token: stored, expiresAt }: ResetToken = JSON.parse(text);
    return stored === token && Date.now() < expiresAt;
  } catch (err) {
    console.error("verifyResetToken failed", err);
    return false;
  }
}

// Single-use: called once a token has been successfully redeemed (or to
// invalidate a stale one before issuing a fresh request), so a reset link
// can't be replayed.
export async function clearResetToken(): Promise<void> {
  try {
    await r2Del(tokenPathname());
  } catch {
    // Nothing to clear — fine.
  }
}
