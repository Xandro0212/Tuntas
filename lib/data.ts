import { getDb } from "./store";
import { diffDays, normalizeWhatsApp, todayISO } from "./dates";
import { getBufferDates } from "./schedule";
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

export function getProjectsForUser(userId: string): Project[] {
  return getDb()
    .projects.filter((project) => project.userId === userId)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
}

export function getHolidays(): Holiday[] {
  return [...getDb().holidays].sort((a, b) => a.date.localeCompare(b.date));
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

export function getProjectBundle(userId: string, projectId: string): ProjectBundle | null {
  const db = getDb();
  const project = db.projects.find((item) => item.id === projectId && item.userId === userId);
  if (!project) return null;
  const phases = db.phases
    .filter((phase) => phase.projectId === projectId)
    .sort((a, b) => a.order - b.order);
  const tasks = db.tasks
    .filter((task) => task.projectId === projectId)
    .sort((a, b) => a.order - b.order);
  const holidays = getHolidays();
  return {
    project,
    phases,
    tasks,
    holidays,
    summary: summarizeProject(project, tasks, holidays),
  };
}

export function getUserTasks(userId: string): Task[] {
  const db = getDb();
  const projectIds = new Set(
    db.projects.filter((project) => project.userId === userId).map((project) => project.id),
  );
  return db.tasks.filter((task) => projectIds.has(task.projectId));
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

export function getOtherProjectTasks(userId: string, excludeProjectId: string): OtherProjectTask[] {
  const db = getDb();
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
      projectTitle: projects.get(task.projectId)!.title,
      title: task.title,
      startDate: task.startDate,
      dueDate: task.dueDate,
      phaseName: phases.get(task.phaseId)?.name ?? "Tugas",
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

export function getClients(userId: string): ClientRecord[] {
  const projects = getProjectsForUser(userId);
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

export function getWorkspaceOverview(user: PublicUser) {
  const projects = getProjectsForUser(user.id);
  const bundles = projects.map((project) => getProjectBundle(user.id, project.id)!);
  const allTasks = bundles.flatMap((bundle) => bundle.tasks);
  return {
    projects,
    bundles,
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
