"use client";

import { useEffect, useRef, useState } from "react";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";
import { LogoutButton } from "@/components/LogoutButton";

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

// On mobile, "Change password" + "Log out" sitting inline in the header
// crowded out the "SRS Catalogue Hub" wordmark down to a truncated "SRS
// Hub". Folding both into a small dropdown behind a hamburger button
// frees that space up — the full name shows at every width now. Desktop
// keeps them inline as before, no dropdown there.
export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="hidden items-center gap-5 sm:flex">
        <ChangePasswordButton />
        <LogoutButton />
      </div>

      <div ref={wrapRef} className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="flex h-8 w-8 items-center justify-center text-white/70 transition hover:text-white"
        >
          <MenuIcon />
        </button>

        {/* No close-on-click here: both buttons below open their own
            local confirm modal on click, setting their own state in the
            same event as any close-the-dropdown click handler here would.
            React batches both updates together, so an eager close here
            would unmount the dropdown (and the buttons with it) before
            their modal state could render — killing the click. Outside
            click / Escape (above) are the only ways this closes. */}
        {open && (
          <div className="animate-fade-up absolute top-full right-0 z-50 mt-2 flex w-52 flex-col overflow-hidden rounded-xl bg-[var(--ink)] py-1 shadow-2xl">
            <ChangePasswordButton className="w-full px-4 py-3.5 text-left font-medium text-white/70 transition hover:bg-white/5 hover:text-white" />
            <div className="mx-4 border-t border-white/10" />
            <LogoutButton className="w-full px-4 py-3.5 text-left font-medium text-white/70 transition hover:bg-white/5 hover:text-white" />
          </div>
        )}
      </div>
    </>
  );
}
