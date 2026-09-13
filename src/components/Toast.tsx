"use client";

// A single toast at a time is all this tool ever needs (one upload or
// one delete happening at once) — no queue, no stacking, just a message
// string the parent clears itself.
export function Toast({ message }: { message: string }) {
  return (
    <div
      style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
      className="animate-toast font-sans-ui pointer-events-none fixed left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[var(--ink)] px-5 py-3 text-center text-sm font-medium text-white shadow-2xl"
    >
      {message}
    </div>
  );
}
