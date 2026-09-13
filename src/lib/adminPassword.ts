import "server-only";
import { r2GetText, r2Put } from "./r2";
import { blobSecretNamespace } from "./blobConfig";

// The admin login password, stored as a small blob instead of a fixed
// environment variable — so the studio can change it themselves (via the
// in-app "Change Password" action) without calling a developer to edit
// Vercel's env vars and redeploy every time. See blobConfig.ts for why
// this is "public" access at an unguessable path rather than "private".
//
// Deliberately NOT read on every request: proxy.ts (which runs on nearly
// every page load) still just compares the session cookie against
// process.env.ADMIN_PASSWORD — that env var's job is now a fixed,
// never-changing session-signing secret, decoupled from the actual login
// password below. Only the login and change-password actions ever touch
// this blob, so normal browsing adds zero extra latency or Blob reads.
function passwordPathname(): string {
  return `config/${blobSecretNamespace()}/admin-password.txt`;
}

export async function getAdminPassword(): Promise<string> {
  try {
    const text = await r2GetText(passwordPathname());
    if (text === null) return process.env.ADMIN_PASSWORD ?? "";
    return text.trim();
  } catch (err) {
    // Blob not created yet (first deploy, before anyone's changed the
    // password) or a transient error — fall back to the env var so this
    // never locks the admin out. Logged, not swallowed silently, so a
    // real misconfiguration (e.g. missing BLOB_SECRET_PATH) is visible.
    console.error("getAdminPassword: falling back to ADMIN_PASSWORD env var", err);
    return process.env.ADMIN_PASSWORD ?? "";
  }
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  await r2Put(passwordPathname(), newPassword, "text/plain");
}
