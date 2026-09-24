"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Soft realtime: refresh the dispatch RSC payload every 20s. */
export function DispatchPoller({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, router]);

  return (
    <p className="sr-only" aria-live="polite">
      Dispatch queue auto-refreshes every {Math.round(intervalMs / 1000)} seconds.
    </p>
  );
}
