import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getOtherProjectTasks,
  getProjectBundle,
  getProjectsForUser,
} from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { ProjectTracker } from "@/components/project-tracker";
import { CalendarView } from "@/components/calendar-view";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const lang = await getLang();
  const bundle = await getProjectBundle(user, id, lang);
  return {
    title: bundle
      ? `${lang === "en" ? "Calendar" : "Kalender"} · ${bundle.project.title}`
      : lang === "en"
        ? "Calendar"
        : "Kalender",
  };
}

export default async function CalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const lang = await getLang();
  const bundle = await getProjectBundle(user, id, lang);
  if (!bundle) notFound();

  const [projects, otherTasks] = await Promise.all([
    getProjectsForUser(user, lang),
    getOtherProjectTasks(user, id, lang),
  ]);

  return (
    <>
      <ProjectTracker projectId={id} />
      <CalendarView
        project={bundle.project}
        phases={bundle.phases}
        tasks={bundle.tasks}
        holidays={bundle.holidays}
        projects={projects.map((project) => ({ id: project.id, title: project.title }))}
        otherTasks={otherTasks}
        today={todayISO()}
        canManage={user.role === "owner"}
      />
    </>
  );
}
