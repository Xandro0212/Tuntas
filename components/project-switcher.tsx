"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, FolderKanban } from "lucide-react";
import { useI18n } from "./language-provider";

export function ProjectSwitcher({
  projects,
  currentId,
}: {
  projects: { id: string; title: string }[];
  currentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const current = projects.find((project) => project.id === currentId);

  return (
    <label className="relative inline-flex h-[38px] max-w-[240px] items-center gap-2 rounded-lg border border-line bg-card px-3 text-[12px] font-semibold text-ink-2 transition hover:border-line-strong">
      <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted" />
      <span className="truncate">{current?.title ?? t("Pilih proyek")}</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        value={currentId}
        onChange={(event) => {
          const suffix = pathname.endsWith("/kalender") ? "/kalender" : "";
          router.push(`/proyek/${event.target.value}${suffix}`);
        }}
        aria-label={t("Pilih proyek")}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    </label>
  );
}
