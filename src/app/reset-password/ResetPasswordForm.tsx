"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="token" value={token} />

      <label
        htmlFor="newPassword"
        className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase"
      >
        New Password
      </label>
      <input
        id="newPassword"
        type="password"
        name="newPassword"
        required
        minLength={6}
        autoFocus
        autoComplete="new-password"
        className="font-sans-ui mb-4 w-full rounded-lg border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
      />

      <label
        htmlFor="confirmPassword"
        className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase"
      >
        Confirm New Password
      </label>
      <input
        id="confirmPassword"
        type="password"
        name="confirmPassword"
        required
        minLength={6}
        autoComplete="new-password"
        className="font-sans-ui mb-4 w-full rounded-lg border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
      />

      {state.error && (
        <p className="font-sans-ui mb-4 text-sm text-red-800">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="font-sans-ui w-full rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
