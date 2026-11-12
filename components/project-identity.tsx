"use client";

import Link from "next/link";
import { Download, MessageCircle, Paperclip } from "lucide-react";
import { ProjectSwitcher } from "./project-switcher";
import { DeleteProjectButton } from "./delete-project-button";
import { EditProjectButton } from "./edit-project-button";
import { PhaseManager } from "./phase-manager";
import { useI18n } from "./language-provider";
import { normalizeWhatsApp, relativeDeadline } from "@/lib/dates";
import { CATEGORY_LABEL } from "@/lib/constants";
import type { Phase, Project } from "@/lib/types";

export function ProjectIdentity({
  project,
  projects,
  eyebrow,
  showExport = true,
  canManage = false,
  phases,
}: {
  project: Project;
  projects: { id: string; title: string }[];
  eyebrow?: string;
  showExport?: boolean;
  canManage?: boolean;
  phases?: Phase[];
}) {
  const { lang, t } = useI18n();
  const wa = normalizeWhatsApp(project.clientWa);
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] font-medium text-muted">
          <span>{t("Proyek")}</span>
          <span className="text-line-strong">/</span>
          <span className="text-ink-2">{t(CATEGORY_LABEL[project.category])}</span>
          {eyebrow && (
            <>
              <span className="text-line-strong">·</span>
              <span>{eyebrow}</span>
            </>
          )}
        </div>
        <h1 className="mt-1.5 max-w-[820px] text-[25px] font-extrabold leading-[1.15] tracking-[-0.038em] text-ink sm:text-[30px]">
          {project.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-muted">
          <span>
            {t("Klien:")} <span className="font-semibold text-ink-2">{project.clientName}</span>
          </span>
          {project.clientWa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-green hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> {project.clientWa}
            </a>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-rust-soft px-2 py-0.5 text-[10.5px] font-bold text-rust">
            {t("Deadline {relative}", { relative: relativeDeadline(project.deadline, lang) })}
          </span>
        </div>
        {project.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.attachments.map((file) => (
              <a
                key={file.url}
                href={file.previewUrl ?? file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-lg border border-line bg-paper px-2 py-1 text-[10px] font-medium text-ink-2 transition hover:border-green/35 hover:text-green"
              >
                <Paperclip className="h-3 w-3 shrink-0" />
                <span className="truncate">{file.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <ProjectSwitcher projects={projects} currentId={project.id} />
        {showExport && (
          <a
            href={`/api/projects/${project.id}/ics`}
            className="btn-secondary btn-sm"
            title={t("Ekspor jadwal proyek ke kalender")}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("Ekspor .ics")}</span>
          </a>
        )}
        {canManage && (
          <Link href="/proyek/baru" className="btn-primary btn-sm hidden sm:inline-flex">
            {t("+ Proyek")}
          </Link>
        )}
        {canManage && phases && (
          <PhaseManager projectId={project.id} phases={phases} />
        )}
        {canManage && <EditProjectButton project={project} />}
        {canManage && (
          <DeleteProjectButton projectId={project.id} projectTitle={project.title} />
        )}
      </div>
    </div>
  );
}
