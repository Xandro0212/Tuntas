import { addDays, weekdayIndex } from "./dates";

export interface ScheduleTaskInput {
  id: string;
  durationDays: number;
  dependsOn: string[];
  order: number;
}

export interface ScheduleResult {
  dates: Record<string, { startDate: string; dueDate: string }>;
  bufferDays: number;
  bufferDates: string[];
  projectStart: string;
  projectFinish: string;
  totalDuration: number;
}

interface ScheduleOptions {
  deadline: string;
  workdays: number[];
  holidays: string[];
  tasks: ScheduleTaskInput[];
}

function holidaySet(holidays: string[]) {
  return new Set(holidays);
}

export function isWorkday(date: string, workdays: number[], holidays: Set<string>): boolean {
  const day = weekdayIndex(date);
  // Minggu selalu libur, apa pun pengaturan pengguna.
  if (day === 0) return false;
  return workdays.includes(day) && !holidays.has(date);
}

export function previousWorkday(date: string, workdays: number[], holidays: Set<string>): string {
  let cursor = addDays(date, -1);
  let guard = 0;
  while (!isWorkday(cursor, workdays, holidays) && guard < 5000) {
    cursor = addDays(cursor, -1);
    guard += 1;
  }
  return cursor;
}

export function nextWorkday(date: string, workdays: number[], holidays: Set<string>): string {
  let cursor = addDays(date, 1);
  let guard = 0;
  while (!isWorkday(cursor, workdays, holidays) && guard < 5000) {
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return cursor;
}

export function countWorkdays(start: string, end: string, workdays: number[], holidays: string[]): number {
  const set = holidaySet(holidays);
  let cursor = start;
  let count = 0;
  let guard = 0;
  while (cursor <= end && guard < 5000) {
    if (isWorkday(cursor, workdays, set)) count += 1;
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return count;
}

/** Tanggal mulai agar start..due (inklusif) berisi `days` hari kerja. */
export function subtractWorkdays(due: string, days: number, workdays: number[], holidays: Set<string>): string {
  const total = Math.max(1, Math.round(days));
  let cursor = due;
  let counted = 1;
  let guard = 0;
  while (counted < total && guard < 5000) {
    cursor = previousWorkday(cursor, workdays, holidays);
    counted += 1;
    guard += 1;
  }
  return cursor;
}

export function getBufferDates(
  deadline: string,
  bufferDays: number,
  workdays: number[],
  holidays: string[],
): string[] {
  const set = holidaySet(holidays);
  const dates: string[] = [];
  let cursor = addDays(deadline, -1);
  let guard = 0;
  while (dates.length < bufferDays && guard < 5000) {
    if (isWorkday(cursor, workdays, set)) dates.push(cursor);
    cursor = addDays(cursor, -1);
    guard += 1;
  }
  return dates.reverse();
}

function scheduleSequential(
  tasks: ScheduleTaskInput[],
  finishLimit: string,
  workdays: number[],
  holidays: Set<string>,
): Record<string, { startDate: string; dueDate: string }> {
  const dates: Record<string, { startDate: string; dueDate: string }> = {};
  const ordered = [...tasks].sort((a, b) => b.order - a.order);
  let cursor = finishLimit;
  for (const task of ordered) {
    const start = subtractWorkdays(cursor, Math.max(1, task.durationDays), workdays, holidays);
    dates[task.id] = { startDate: start, dueDate: cursor };
    cursor = previousWorkday(start, workdays, holidays);
  }
  return dates;
}

export function scheduleTasks(options: ScheduleOptions): ScheduleResult {
  const { deadline, workdays, holidays, tasks } = options;
  const cleanWorkdays = Array.from(new Set(workdays)).filter((day) => day !== 0);
  const set = holidaySet(holidays);
  const totalDuration = tasks.reduce((sum, task) => sum + Math.max(1, task.durationDays), 0);
  const bufferDays = Math.max(1, Math.ceil(totalDuration * 0.1));
  const bufferDates = getBufferDates(deadline, bufferDays, cleanWorkdays, holidays);
  const finishLimit = previousWorkday(
    bufferDates[0] ?? deadline,
    cleanWorkdays,
    set,
  );

  const dates: Record<string, { startDate: string; dueDate: string }> = {};

  if (tasks.length === 0) {
    return {
      dates,
      bufferDays,
      bufferDates,
      projectStart: finishLimit,
      projectFinish: finishLimit,
      totalDuration,
    };
  }

  const byId = new Map(tasks.map((task) => [task.id, task]));
  const children = new Map<string, string[]>();
  for (const task of tasks) {
    for (const dep of task.dependsOn) {
      if (!byId.has(dep)) continue;
      const list = children.get(dep) ?? [];
      list.push(task.id);
      children.set(dep, list);
    }
  }

  const starts = new Map<string, string>();
  const finishes = new Map<string, string>();
  const visiting = new Set<string>();
  let hasCycle = false;

  const getStart = (id: string): string => {
    if (starts.has(id)) return starts.get(id)!;
    const task = byId.get(id);
    if (!task) return finishLimit;
    if (visiting.has(id)) {
      hasCycle = true;
      return finishLimit;
    }
    visiting.add(id);
    const finish = getFinish(id, task);
    visiting.delete(id);
    const start = subtractWorkdays(
      finish,
      Math.max(1, task.durationDays),
      cleanWorkdays,
      set,
    );
    starts.set(id, start);
    return start;
  };

  const getFinish = (id: string, task: ScheduleTaskInput): string => {
    if (finishes.has(id)) return finishes.get(id)!;
    const kids = children.get(id) ?? [];
    let finish = finishLimit;
    for (const child of kids) {
      const childStart = getStart(child);
      const candidate = previousWorkday(childStart, cleanWorkdays, set);
      if (candidate < finish) finish = candidate;
    }
    finishes.set(id, finish);
    return finish;
  };

  try {
    for (const task of tasks) {
      getFinish(task.id, task);
      getStart(task.id);
    }
  } catch {
    hasCycle = true;
  }

  if (hasCycle || starts.size !== tasks.length) {
    const fallback = scheduleSequential(tasks, finishLimit, cleanWorkdays, set);
    const startDates = Object.values(fallback).map((date) => date.startDate);
    const finishDates = Object.values(fallback).map((date) => date.dueDate);
    return {
      dates: fallback,
      bufferDays,
      bufferDates,
      projectStart: startDates.sort()[0],
      projectFinish: finishDates.sort().at(-1) ?? finishLimit,
      totalDuration,
    };
  }

  for (const task of tasks) {
    dates[task.id] = {
      startDate: starts.get(task.id)!,
      dueDate: finishes.get(task.id)!,
    };
  }

  const allStarts = Object.values(dates).map((date) => date.startDate);
  const allFinishes = Object.values(dates).map((date) => date.dueDate);

  return {
    dates,
    bufferDays,
    bufferDates,
    projectStart: allStarts.sort()[0] ?? finishLimit,
    projectFinish: allFinishes.sort().at(-1) ?? finishLimit,
    totalDuration,
  };
}

export function scheduleSingleTask(options: {
  deadline: string;
  bufferDays: number;
  workdays: number[];
  holidays: string[];
  durationDays: number;
}) {
  const set = holidaySet(options.holidays);
  const bufferDates = getBufferDates(options.deadline, options.bufferDays, options.workdays, options.holidays);
  const finish = previousWorkday(bufferDates[0] ?? options.deadline, options.workdays, set);
  const start = subtractWorkdays(finish, Math.max(1, options.durationDays), options.workdays, set);
  return { startDate: start, dueDate: finish };
}
