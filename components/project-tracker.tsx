"use client";

import { useEffect } from "react";

export function ProjectTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    fetch("/api/active-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId }),
    }).catch(() => undefined);
  }, [projectId]);
  return null;
}
