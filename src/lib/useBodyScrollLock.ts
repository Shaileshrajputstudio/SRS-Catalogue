"use client";

import { useEffect } from "react";

// Locks the page behind a full-screen modal from scrolling — without
// this, the backdrop looked open but the page underneath kept moving on
// touch/wheel scroll. Restores whatever overflow value was there before,
// not just "", so nesting two locked modals doesn't clobber each other.
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
