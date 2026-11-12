"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps server-rendered pages fresh across devices without a full realtime
 * infrastructure: refresh every 30s while visible and immediately on focus.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    const schedule = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(refresh, intervalMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        schedule();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, router]);

  return null;
}
