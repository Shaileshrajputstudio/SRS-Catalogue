"use client";

import { useEffect, useState, useTransition } from "react";
import { logout } from "@/app/actions";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

// "Log out" in the top bar — a click opens the same centered confirm
// popup pattern used for removing a brochure, rather than a corner
// popover, so both destructive/exiting confirmations look consistent.
export function LogoutButton() {
  const [confirming, setConfirming] = useState(false);
  useBodyScrollLock(confirming);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!confirming) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirming(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  function confirmLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="font-medium text-white/70 transition hover:text-white"
      >
        Log out
      </button>

      {confirming && (
        <div
          className="animate-backdrop-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:px-4"
          onClick={() => setConfirming(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
            className="animate-sheet-up font-sans-ui w-full max-w-sm rounded-t-2xl bg-[var(--paper)] p-6 shadow-2xl sm:rounded-2xl"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--ink)]/15 sm:hidden" />
            <h3 className="mb-2 text-lg text-[var(--ink)]">Log out?</h3>
            <p className="mb-5 text-sm text-[var(--ink)]/70">You&apos;ll need your password to sign back in.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="flex-1 rounded-full border border-[var(--line)] bg-[#F6F3E8] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isPending}
                className="flex-1 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                {isPending ? "Logging out…" : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
