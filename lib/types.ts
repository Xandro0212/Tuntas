export type Category = "kerajinan" | "katering" | "konveksi" | "jasa" | "lainnya";

export type TaskType = "internal" | "waiting_client" | "vendor" | "payment" | "delivery";

export type TaskStatus = "todo" | "doing" | "waiting" | "done";

export type HolidaySource = "national" | "bali" | "user";

export type Role = "owner" | "employee";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface User {
  id: string;
  workspaceId: string;
  role: Role;
  name: string;
  businessName: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  isDemo?: boolean;
}

export type PublicUser = Omit<User, "passwordHash" | "salt">;

export interface Attachment {
  name: string;
  url: string;
  previewUrl?: string;
  size?: number;
}

export interface Project {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  category: Category;
  clientName: string;
  clientWa: string;
  deadline: string;
  deadlineTime?: string;
  bufferDays: number;
  story: string;
  value?: number;
  team: string[];
  workdays: number[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Task {
  id: string;
  projectId: string;
  phaseId: string;
  title: string;
  type: TaskType;
  startDate: string;
  dueDate: string;
  durationDays: number;
  dependsOn: string[];
  assignee: string;
  assigneeUserId?: string | null;
  status: TaskStatus;
  source: "ai" | "manual";
  order: number;
  completedAt?: string | null;
  progressNote?: string;
}

export interface Holiday {
  id: string;
  workspaceId: string;
  date: string;
  name: string;
  source: HolidaySource;
}

export interface Invite {
  id: string;
  token: string;
  workspaceId: string;
  email: string;
  name: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
}

export type ActivityAction =
  | "project.create"
  | "project.update"
  | "project.delete"
  | "task.create"
  | "task.update"
  | "task.delete"
  | "phase.create"
  | "phase.update"
  | "phase.delete"
  | "holiday.create"
  | "holiday.delete"
  | "employee.create"
  | "employee.delete"
  | "invite.create"
  | "invite.accept"
  | "invite.delete"
  | "schedule.update";

export interface Activity {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  detail: string;
  entityId: string;
  createdAt: string;
}

export interface Database {
  workspaces: Workspace[];
  invites: Invite[];
  activities: Activity[];
  users: User[];
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  holidays: Holiday[];
}

export interface TodayTask extends Task {
  projectTitle: string;
  phaseName: string;
}

export interface ProjectSummary {
  done: number;
  total: number;
  progress: number;
  bufferDays: number;
  bufferRemaining: number;
  bufferDates: string[];
  projectStart: string;
  projectFinish: string;
  lateTasks: Task[];
  daysToDeadline: number;
}

export interface AiQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface AiPhase {
  id: string;
  name: string;
}

export interface AiTask {
  id: string;
  phase: string;
  title: string;
  duration_days: number;
  depends_on: string[];
  type: TaskType;
  assignee: string;
}

export interface AiPlan {
  questions: AiQuestion[];
  phases: AiPhase[];
  tasks: AiTask[];
  risks: string[];
}

export interface DraftTask {
  tempId: string;
  phaseIndex: number;
  title: string;
  type: TaskType;
  durationDays: number;
  dependsOn: string[];
  assignee: string;
  source: "ai" | "manual";
}
