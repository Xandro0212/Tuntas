import { getDb } from "./store";
import { diffDays, normalizeWhatsApp, todayISO } from "./dates";
import { getBufferDates } from "./schedule";
import { translate, type Lang } from "./i18n";
import type {
  Holiday,
  Phase,
  Project,
  ProjectSummary,
  PublicUser,
  Task,
} from "./types";

export interface ProjectBundle {
  project: Project;
  phases: Phase[];
  tasks: Task[];
  holidays: Holiday[];
  summary: ProjectSummary;
}

export function localizeProject(lang: Lang, project: Project): Project {
  return {
    ...project,
    title: translate(lang, project.title),
    clientName: translate(lang, project.clientName),
  };
}

export function localizePhase(lang: Lang, phase: Phase): Phase {
  return { ...phase, name: translate(lang, phase.name) };
}

export function localizeTask(lang: Lang, task: Task): Task {
  return {
    ...task,
    title: translate(lang, task.title),
    assignee: translate(lang, task.assignee),
    progressNote: task.progressNote ? translate(lang, task.progressNote) : task.progressNote,
  };
}

export function localizeHoliday(lang: Lang, holiday: Holiday): Holiday {
  return { ...holiday, name: translate(lang, holiday.name) };
}

export async function getProjectsForUser(
  userId: string,
  lang: Lang = "id",
): Promise<Project[]> {
  const db = await getDb();
  return db.projects
    .filter((project) => project.userId === userId)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .map((project) => localizeProject(lang, project));
}

export async function getHolidays(lang: Lang = "id"): Promise<Holiday[]> {
  const db = await getDb();
  return [...db.holidays]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((holiday) => localizeHoliday(lang, holiday));
}

export function summarizeProject(
  project: Project,
  tasks: Task[],
  holidays: Holiday[],
): ProjectSummary {
  const today = todayISO();
  const done = tasks.filter((task) => task.status === "done").length;
  const total = tasks.length;
  const bufferDates = getBufferDates(
    project.deadline,
    Math.max(1, project.bufferDays),
    project.workdays,
    holidays.map((holiday) => holiday.date),
  );
  const starts = tasks.map((task) => task.startDate).sort();
  const finishes = tasks.map((task) => task.dueDate).sort();
  const lateTasks = tasks
    .filter((task) => task.status !== "done" && task.dueDate < today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return {
    done,
    total,
    progress: total ? Math.round((done / total) * 100) : 0,
    bufferDays: Math.max(1, project.bufferDays),
    bufferRemaining: bufferDates.filter((date) => date >= today).length,
    bufferDates,
    projectStart: starts[0] ?? today,
    projectFinish: finishes.at(-1) ?? today,
    lateTasks,
    daysToDeadline: diffDays(today, project.deadline),
  };
}

export async function getProjectBundle(
  userId: string,
  projectId: string,
  lang: Lang = "id",
): Promise<ProjectBundle | null> {
  const db = await getDb();
  const rawProject = db.projects.find((item) => item.id === projectId && item.userId === userId);
  if (!rawProject) return null;
  const project = localizeProject(lang, rawProject);
  const phases = db.phases
    .filter((phase) => phase.projectId === projectId)
    .sort((a, b) => a.order - b.order)
    .map((phase) => localizePhase(lang, phase));
  const tasks = db.tasks
    .filter((task) => task.projectId === projectId)
    .sort((a, b) => a.order - b.order)
    .map((task) => localizeTask(lang, task));
  const holidays = await getHolidays(lang);
  return {
    project,
    phases,
    tasks,
    holidays,
    summary: summarizeProject(project, tasks, holidays),
  };
}

export async function getUserTasks(userId: string, lang: Lang = "id"): Promise<Task[]> {
  const db = await getDb();
  const projectIds = new Set(
    db.projects.filter((project) => project.userId === userId).map((project) => project.id),
  );
  return db.tasks
    .filter((task) => projectIds.has(task.projectId))
    .map((task) => localizeTask(lang, task));
}

export interface OtherProjectTask {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  startDate: string;
  dueDate: string;
  phaseName: string;
  status: Task["status"];
}

export async function getOtherProjectTasks(
  userId: string,
  excludeProjectId: string,
  lang: Lang = "id",
): Promise<OtherProjectTask[]> {
  const db = await getDb();
  const projects = new Map(
    db.projects
      .filter((project) => project.userId === userId && project.id !== excludeProjectId)
      .map((project) => [project.id, project]),
  );
  const phases = new Map(db.phases.map((phase) => [phase.id, phase]));
  return db.tasks
    .filter((task) => projects.has(task.projectId))
    .map((task) => ({
      id: task.id,
      projectId: task.projectId,
      projectTitle: translate(lang, projects.get(task.projectId)!.title),
      title: translate(lang, task.title),
      startDate: task.startDate,
      dueDate: task.dueDate,
      phaseName: translate(lang, phases.get(task.phaseId)?.name ?? "Tugas"),
      status: task.status,
    }));
}

export function getNearestProject(projects: Project[]): Project | null {
  const today = todayISO();
  const upcoming = projects
    .filter((project) => project.deadline >= today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  return upcoming[0] ?? projects.at(-1) ?? null;
}

export interface ClientRecord {
  key: string;
  name: string;
  wa: string;
  projects: Project[];
  totalValue: number;
}

export async function getClients(
  userId: string,
  lang: Lang = "id",
): Promise<ClientRecord[]> {
  const projects = await getProjectsForUser(userId, lang);
  const map = new Map<string, ClientRecord>();
  for (const project of projects) {
    const key = `${project.clientName.toLowerCase()}|${normalizeWhatsApp(project.clientWa)}`;
    const existing = map.get(key);
    if (existing) {
      existing.projects.push(project);
      existing.totalValue += project.value ?? 0;
    } else {
      map.set(key, {
        key,
        name: project.clientName,
        wa: project.clientWa,
        projects: [project],
        totalValue: project.value ?? 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getWorkspaceOverview(user: PublicUser, lang: Lang = "id") {
  const projects = await getProjectsForUser(user.id, lang);
  const bundles = await Promise.all(
    projects.map((project) => getProjectBundle(user.id, project.id, lang)),
  );
  const presentBundles = bundles.filter(
    (bundle): bundle is ProjectBundle => Boolean(bundle),
  );
  const allTasks = presentBundles.flatMap((bundle) => bundle.tasks);
  return {
    projects,
    bundles: presentBundles,
    totals: {
      projects: projects.length,
      active: projects.filter((project) => project.deadline >= todayISO()).length,
      tasks: allTasks.length,
      done: allTasks.filter((task) => task.status === "done").length,
      value: projects.reduce((sum, project) => sum + (project.value ?? 0), 0),
      late: allTasks.filter((task) => task.status !== "done" && task.dueDate < todayISO()).length,
    },
  };
}
