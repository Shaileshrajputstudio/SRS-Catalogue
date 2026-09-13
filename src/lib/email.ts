import "server-only";
import { Resend } from "resend";
import { studio } from "./studio";

// Falls back to logging the link instead of sending whenever the
// required env vars aren't set, so local dev keeps working without a
// Resend key and nothing throws if PASSWORD_RECOVERY_EMAIL is missing.
export async function sendPasswordResetEmail(resetUrl: string): Promise<void> {
  const to = process.env.PASSWORD_RECOVERY_EMAIL;
  if (!to) {
    console.log(`[email:no-recipient] PASSWORD_RECOVERY_EMAIL not set. Reset link:\n${resetUrl}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:not-configured] RESEND_API_KEY not set. Would send to ${to}:\n${resetUrl}`);
    return;
  }

  // Sending "from" an unverified domain only delivers to the Resend
  // account's own signup address — verify a domain in Resend and set
  // RESEND_FROM_EMAIL to an address on it for delivery to any inbox.
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${studio.name} <${from}>`,
    to,
    subject: "Reset your SRS Catalogue password",
    html: `
      <p>A password reset was requested for the SRS Catalogue admin login.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    console.error("[email:resend-error]", error);
    throw new Error("Failed to send password reset email");
  }
}
