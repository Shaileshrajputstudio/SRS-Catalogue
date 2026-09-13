"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePassword, type ChangePasswordState } from "@/app/actions";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

const initialState: ChangePasswordState = {};

// The form (and its useActionState) live in this child, mounted only
// while the dialog is open — so every reopen gets a fresh
// useActionState instead of showing the previous "Password updated"
// success screen again.
function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="font-sans-ui w-full max-w-sm rounded-2xl bg-[var(--paper)] p-6 text-left shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-lg text-[var(--ink)]">Change Password</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-lg text-[var(--ink)]/50 hover:text-[var(--ink)]"
          >
            ✕
          </button>
        </div>

        {state.success ? (
          <>
            <p className="mb-5 text-sm leading-relaxed text-[var(--ink)]/70">
              Password updated. Use it next time you log in.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)]"
            >
              Done
            </button>
          </>
        ) : (
          <form ref={formRef} action={formAction} className="flex flex-col gap-3">
            <input
              type="password"
              name="currentPassword"
              placeholder="Current password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />

            {state.error && <p className="text-sm text-red-600">{state.error}</p>}

            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// "Change password" in the top bar, next to Log out — lets the studio
// update their own login password without calling a developer to edit it.
// A centered modal (like UploadBrochureModal), not an anchored dropdown
// like LogoutButton — three fields read better as a dialog than a corner
// popover.
export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-medium text-white/70 transition hover:text-white"
      >
        Change password
      </button>

      {open && <ChangePasswordDialog onClose={() => setOpen(false)} />}
    </>
  );
}
