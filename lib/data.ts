import { toPublicUser } from "./auth";
import { GLOBAL_WORKSPACE_ID } from "./migrate";
import { getDb } from "./store";
import { signAttachmentUrl } from "./uploads";
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
  Workspace,
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
  user: PublicUser,
  lang: Lang = "id",
): Promise<Project[]> {
  const db = await getDb();
  return db.projects
    .filter((project) => project.workspaceId === user.workspaceId)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .map((project) => localizeProject(lang, project));
}

export async function getHolidays(
  workspaceId: string,
  lang: Lang = "id",
): Promise<Holiday[]> {
  const db = await getDb();
  return db.holidays
    .filter(
      (holiday) =>
        holiday.workspaceId === workspaceId ||
        holiday.workspaceId === GLOBAL_WORKSPACE_ID,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((holiday) => localizeHoliday(lang, holiday));
}

export async function getWorkspace(
  workspaceId: string,
): Promise<Workspace | null> {
  const db = await getDb();
  return db.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
}

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<PublicUser[]> {
  const db = await getDb();
  return db.users
    .filter((user) => user.workspaceId === workspaceId)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map(toPublicUser);
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
  user: PublicUser,
  projectId: string,
  lang: Lang = "id",
): Promise<ProjectBundle | null> {
  const db = await getDb();
  const rawProject = db.projects.find(
    (item) => item.id === projectId && item.workspaceId === user.workspaceId,
  );
  if (!rawProject) return null;
  const localized = localizeProject(lang, rawProject);
  const attachments = await Promise.all(
    localized.attachments.map(async (file) => {
      try {
        return { ...file, previewUrl: await signAttachmentUrl(file.url) };
      } catch {
        return file;
      }
    }),
  );
  const project = { ...localized, attachments };
  const phases = db.phases
    .filter((phase) => phase.projectId === projectId)
    .sort((a, b) => a.order - b.order)
    .map((phase) => localizePhase(lang, phase));
  const tasks = db.tasks
    .filter((task) => task.projectId === projectId)
    .sort((a, b) => a.order - b.order)
    .map((task) => localizeTask(lang, task));
  const holidays = await getHolidays(rawProject.workspaceId, lang);
  return {
    project,
    phases,
    tasks,
    holidays,
    summary: summarizeProject(project, tasks, holidays),
  };
}

export async function getUserTasks(user: PublicUser, lang: Lang = "id"): Promise<Task[]> {
  const db = await getDb();
  const projectIds = new Set(
    db.projects
      .filter((project) => project.workspaceId === user.workspaceId)
      .map((project) => project.id),
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
  user: PublicUser,
  excludeProjectId: string,
  lang: Lang = "id",
): Promise<OtherProjectTask[]> {
  const db = await getDb();
  const projects = new Map(
    db.projects
      .filter(
        (project) =>
          project.workspaceId === user.workspaceId && project.id !== excludeProjectId,
      )
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
  user: PublicUser,
  lang: Lang = "id",
): Promise<ClientRecord[]> {
  const projects = await getProjectsForUser(user, lang);
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
  const projects = await getProjectsForUser(user, lang);
  const bundles = await Promise.all(
    projects.map((project) => getProjectBundle(user, project.id, lang)),
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
