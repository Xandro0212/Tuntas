import { requireUser } from "@/lib/auth";
import { getNearestProject, getProjectsForUser, getProjectBundle } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { addDays, formatLongDate, todayISO } from "@/lib/dates";
import { TodayView } from "@/components/today-view";
import type { TodayTask } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "Today" : "Hari ini" };
}

export default async function TodayPage() {
  const user = await requireUser();
  const lang = await getLang();
  const projects = getProjectsForUser(user.id);
  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const bundles = projects.map((project) => getProjectBundle(user.id, project.id)!);

  const allTasks: TodayTask[] = bundles.flatMap((bundle) => {
    const phaseMap = new Map(bundle.phases.map((phase) => [phase.id, phase.name]));
    return bundle.tasks.map((task) => ({
      ...task,
      projectTitle: bundle.project.title,
      phaseName: phaseMap.get(task.phaseId) ?? "Tugas",
    }));
  });

  const todayList = allTasks.filter(
    (task) => task.dueDate === today || (task.dueDate < today && task.status !== "done"),
  );
  const tomorrowTasks = allTasks.filter((task) => task.dueDate === tomorrow);

  const nearest = getNearestProject(projects);
  const nearestBundle = nearest ? bundles.find((bundle) => bundle.project.id === nearest.id) : null;

  return (
    <TodayView
      user={user}
      today={today}
      todayLabel={formatLongDate(today, true, lang)}
      todayTasks={todayList}
      tomorrowLabel={formatLongDate(tomorrow, true, lang)}
      tomorrowTasks={tomorrowTasks}
      nearest={
        nearest && nearestBundle
          ? {
              project: nearest,
              done: nearestBundle.summary.done,
              total: nearestBundle.summary.total,
              progress: nearestBundle.summary.progress,
            }
          : null
      }
      projects={projects.map((project) => ({
        id: project.id,
        title: project.title,
        deadline: project.deadline,
      }))}
    />
  );
}
