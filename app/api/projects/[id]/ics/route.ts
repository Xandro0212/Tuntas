import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/store";
import { addDays } from "@/lib/dates";

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
  const db = getDb();
  const project = db.projects.find((item) => item.id === id && item.userId === user.id);
  if (!project) return new Response("Not found", { status: 404 });
  const tasks = db.tasks
    .filter((task) => task.projectId === project.id)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tuntas//Kanban UMKM//ID",
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
        `${project.title} · Tahap: ${db.phases.find((phase) => phase.id === task.phaseId)?.name ?? "-"} · PJ: ${task.assignee} · Status: ${task.status}`,
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
    `SUMMARY:${escapeIcs(`DEADLINE KLIEN — ${project.title}`)}`,
    `DESCRIPTION:${escapeIcs(`Klien: ${project.clientName}`)}`,
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
