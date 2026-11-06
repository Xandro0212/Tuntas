import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/store";
import { getLang } from "@/lib/lang-server";
import { localizeProject, localizeTask } from "@/lib/data";
import { STATUSES } from "@/lib/constants";
import { addDays } from "@/lib/dates";
import { translate } from "@/lib/i18n";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function compactDate(value: string) {
  return value.replace(/-/g, "");
}

function stamp() {
  return `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const lang = await getLang();
  const db = getDb();
  const rawProject = db.projects.find((item) => item.id === id && item.userId === user.id);
  if (!rawProject) return new Response("Not found", { status: 404 });
  const project = localizeProject(lang, rawProject);
  const tasks = db.tasks
    .filter((task) => task.projectId === rawProject.id)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((task) => localizeTask(lang, task));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Tuntas//Kanban UMKM//${lang.toUpperCase()}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(project.title)}`,
  ];

  for (const task of tasks) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@tuntas.local`,
      `DTSTAMP:${stamp()}`,
      `DTSTART;VALUE=DATE:${compactDate(task.startDate)}`,
      `DTEND;VALUE=DATE:${compactDate(addDays(task.dueDate, 1))}`,
      `SUMMARY:${escapeIcs(task.title)}`,
      `DESCRIPTION:${escapeIcs(
        `${project.title} · ${translate(lang, "Tahap")}: ${translate(
          lang,
          db.phases.find((phase) => phase.id === task.phaseId)?.name ?? "Tugas",
        )} · ${translate(lang, "PJ")}: ${task.assignee} · ${translate(
          lang,
          "Status",
        )}: ${translate(lang, STATUSES.find((item) => item.id === task.status)?.label ?? task.status)}`,
      )}`,
      "END:VEVENT",
    );
  }

  lines.push(
    "BEGIN:VEVENT",
    `UID:${project.id}-deadline@tuntas.local`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${compactDate(project.deadline)}`,
    `DTEND;VALUE=DATE:${compactDate(addDays(project.deadline, 1))}`,
    `SUMMARY:${escapeIcs(
      `${translate(lang, "Deadline klien").toUpperCase()} — ${project.title}`,
    )}`,
    `DESCRIPTION:${escapeIcs(`${translate(lang, "Klien:")} ${project.clientName}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  );

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="tuntas-${project.id}.ics"`,
    },
  });
}
