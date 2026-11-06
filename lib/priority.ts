import { diffDays, formatLongDate, formatShortDate, todayISO } from "./dates";
import { translate, type Lang } from "./i18n";
import type { Project, ProjectSummary, Task } from "./types";

export type PriorityRisk = "kritis" | "tinggi" | "sedang" | "aman";

export interface PriorityBundle {
  project: Project;
  tasks: Task[];
  summary: ProjectSummary;
}

export interface PriorityItem {
  project: Project;
  order: number;
  daysToDeadline: number;
  done: number;
  total: number;
  progress: number;
  remainingTasks: Task[];
  remainingTaskCount: number;
  remainingDuration: number;
  lateCount: number;
  bufferRemaining: number;
  projectFinish: string;
  risk: PriorityRisk;
  riskLabel: string;
  focusLabel: string;
  reason: string;
}

export interface DeadlineTie {
  deadline: string;
  items: PriorityItem[];
  recommendation: string;
}

export interface PriorityPlan {
  items: PriorityItem[];
  completedCount: number;
  ties: DeadlineTie[];
  hasTies: boolean;
  headline: string;
  recommendation: string;
}

const RISK_LABEL: Record<Lang, Record<PriorityRisk, string>> = {
  id: {
    kritis: "Kritis",
    tinggi: "Tinggi",
    sedang: "Sedang",
    aman: "Aman",
  },
  en: {
    kritis: "Critical",
    tinggi: "High",
    sedang: "Medium",
    aman: "Safe",
  },
};

function uniqueNames(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function riskOf(item: {
  daysToDeadline: number;
  lateCount: number;
  bufferRemaining: number;
  progress: number;
}): PriorityRisk {
  if (item.lateCount > 0 || item.daysToDeadline <= 0 || item.bufferRemaining <= 1) {
    return "kritis";
  }
  if (item.daysToDeadline <= 7) return "tinggi";
  if (item.daysToDeadline <= 21 || item.progress < 35) return "sedang";
  return "aman";
}

function tieRecommendation(group: PriorityItem[], lang: Lang = "id"): string {
  const byRisk = [...group].sort((a, b) => {
    const scoreA = a.lateCount * 300 + (100 - a.progress) + Math.max(0, a.remainingDuration - a.daysToDeadline) * 5;
    const scoreB = b.lateCount * 300 + (100 - b.progress) + Math.max(0, b.remainingDuration - b.daysToDeadline) * 5;
    return scoreB - scoreA;
  });
  const mostCritical = byRisk[0];
  const quickest = [...group].sort(
    (a, b) => a.remainingTaskCount - b.remainingTaskCount || b.progress - a.progress,
  )[0];
  const deadline = formatLongDate(group[0].project.deadline, false, lang);
  const team = uniqueNames(group.flatMap((item) => item.project.team));
  const split = team.slice(0, 3);
  const sentences: string[] = [];
  const withLate = group.find((item) => item.lateCount > 0);
  const lateTask = withLate
    ? withLate.remainingTasks
        .filter((task) => task.dueDate < todayISO())
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
    : undefined;

  if (lang === "en") {
    if (quickest.project.id !== mostCritical.project.id) {
      sentences.push(
        `Focus on ${mostCritical.project.title} first because progress is only ${mostCritical.progress}% with ${mostCritical.remainingTaskCount} tasks left. ${quickest.project.title} can be prepared in parallel with only ${quickest.remainingTaskCount} tasks left (${quickest.progress}%).`,
      );
    } else {
      sentences.push(
        `Focus on ${mostCritical.project.title} first: ${mostCritical.remainingTaskCount} tasks left and ${mostCritical.bufferRemaining} buffer days. Schedule the other work in parallel, not sequentially.`,
      );
    }
    if (split.length > 1) {
      sentences.push(
        `Split the team: ${split[0]} owns the critical path for ${mostCritical.project.title}, ${split[1]} prepares ${quickest.project.title}${split[2] ? `, and ${split[2]} protects delivery/handover` : ""}.`,
      );
    }
    if (lateTask) {
      sentences.push(
        `Finish "${lateTask.title}" — it is already late — before adding new work to that project.`,
      );
    }
    sentences.push(
      `Both share the ${deadline} deadline. Do not spend the ${Math.min(...group.map((item) => item.bufferRemaining))} buffer days on revisions; keep them for delivery and QC.`,
    );
  } else {
    if (quickest.project.id !== mostCritical.project.id) {
      sentences.push(
        `Fokuskan ${mostCritical.project.title} lebih dulu karena progres baru ${mostCritical.progress}% dan sisa ${mostCritical.remainingTaskCount} tugas. ${quickest.project.title} bisa disiapkan paralel karena tinggal ${quickest.remainingTaskCount} tugas (${quickest.progress}%).`,
      );
    } else {
      sentences.push(
        `Fokuskan ${mostCritical.project.title} lebih dulu: sisa ${mostCritical.remainingTaskCount} tugas dan cadangan ${mostCritical.bufferRemaining} hari. Jadwalkan pekerjaan lain secara paralel, bukan berurutan.`,
      );
    }
    if (split.length > 1) {
      sentences.push(
        `Bagi tim: ${split[0]} memegang jalur kritis ${mostCritical.project.title}, ${split[1]} menyiapkan ${quickest.project.title}${split[2] ? `, dan ${split[2]} menjaga pengiriman/serah terima` : ""}.`,
      );
    }
    if (lateTask) {
      sentences.push(
        `Selesaikan "${lateTask.title}" yang sudah terlambat sebelum menambah pekerjaan baru di proyek itu.`,
      );
    }
    sentences.push(
      `Keduanya deadline ${deadline}. Jangan pakai cadangan ${Math.min(...group.map((item) => item.bufferRemaining))} hari untuk revisi; sisakan untuk pengiriman dan QC.`,
    );
  }

  return sentences.join(" ");
}

export function buildPriorityPlan(bundles: PriorityBundle[], lang: Lang = "id"): PriorityPlan {
  const today = todayISO();
  const completedCount = bundles.filter((bundle) => {
    const done = bundle.tasks.filter((task) => task.status === "done").length;
    return bundle.tasks.length > 0 && done === bundle.tasks.length;
  }).length;

  const activeBundles = bundles.filter((bundle) => {
    const done = bundle.tasks.filter((task) => task.status === "done").length;
    return bundle.tasks.length === 0 || done < bundle.tasks.length;
  });

  const items: PriorityItem[] = activeBundles
    .map((bundle) => {
      const remainingTasks = bundle.tasks.filter((task) => task.status !== "done");
      const done = bundle.tasks.length - remainingTasks.length;
      const total = bundle.tasks.length;
      const progress = bundle.summary.progress;
      const remainingDuration = remainingTasks.reduce(
        (sum, task) => sum + Math.max(1, task.durationDays),
        0,
      );
      const daysToDeadline = diffDays(today, bundle.project.deadline);
      const lateCount = bundle.summary.lateTasks.length;
      const bufferRemaining = bundle.summary.bufferRemaining;
      const risk = riskOf({ daysToDeadline, lateCount, bufferRemaining, progress });

      return {
        project: bundle.project,
        order: 0,
        daysToDeadline,
        done,
        total,
        progress,
        remainingTasks,
        remainingTaskCount: remainingTasks.length,
        remainingDuration,
        lateCount,
        bufferRemaining,
        projectFinish: bundle.summary.projectFinish,
        risk,
        riskLabel: RISK_LABEL[lang][risk],
        focusLabel: translate(lang, "Jaga jadwal"),
        reason:
          lang === "en"
            ? `${formatShortDate(bundle.project.deadline, lang)} · ${
                daysToDeadline >= 0
                  ? `${daysToDeadline} days left`
                  : `${Math.abs(daysToDeadline)} days overdue`
              } · target ${formatShortDate(bundle.summary.projectFinish, lang)} · ${remainingDuration} working ${
                remainingDuration === 1 ? "day" : "days"
              } left / ${remainingTasks.length} ${remainingTasks.length === 1 ? "task" : "tasks"} · ${bufferRemaining} buffer ${
                bufferRemaining === 1 ? "day" : "days"
              }`
            : `${formatShortDate(bundle.project.deadline)} · ${
                daysToDeadline >= 0
                  ? `${daysToDeadline} hari lagi`
                  : `lewat ${Math.abs(daysToDeadline)} hari`
              } · target ${formatShortDate(bundle.summary.projectFinish)} · sisa ${remainingDuration} hari kerja / ${remainingTasks.length} tugas · cadangan ${bufferRemaining} hari`,
      };
    })
    .sort((a, b) => {
      if (a.daysToDeadline !== b.daysToDeadline) {
        return a.daysToDeadline - b.daysToDeadline;
      }
      const riskScore = (item: PriorityItem) =>
        item.lateCount * 300 +
        (100 - item.progress) +
        Math.max(0, item.remainingDuration - item.daysToDeadline) * 5 +
        (item.bufferRemaining <= 1 ? 25 : 0);
      return riskScore(b) - riskScore(a);
    })
    .map((item, index) => ({
      ...item,
      order: index + 1,
      focusLabel:
        index === 0
          ? translate(lang, "Fokus utama")
          : index === 1
            ? translate(lang, "Berikutnya")
            : index === 2
              ? translate(lang, "Jaga jadwal")
              : translate(lang, "Setelah itu"),
    }));

  const byDeadline = new Map<string, PriorityItem[]>();
  for (const item of items) {
    const key = item.project.deadline;
    const group = byDeadline.get(key) ?? [];
    group.push(item);
    byDeadline.set(key, group);
  }

  const ties: DeadlineTie[] = [];
  for (const [deadline, group] of byDeadline.entries()) {
    if (group.length < 2) continue;
    ties.push({
      deadline,
      items: group,
      recommendation: tieRecommendation(group, lang),
    });
  }
  ties.sort((a, b) => a.deadline.localeCompare(b.deadline));

  const top = items[0];
  let recommendation = "";
  if (!top) {
    recommendation = translate(
      lang,
      "Semua proyek sudah selesai. Waktunya mengecek kualitas hasil, menagih pelunasan, dan menyiapkan cerita untuk proyek berikutnya.",
    );
  } else if (ties.length > 0) {
    const firstTie = ties[0];
    const topInTie = firstTie.items.some((item) => item.project.id === top.project.id);
    recommendation = topInTie
      ? firstTie.recommendation
      : lang === "en"
        ? `Start with ${top.project.title} (deadline ${formatLongDate(top.project.deadline, false, lang)}). For the conflicting deadline on ${formatLongDate(firstTie.deadline, false, lang)}: ${firstTie.recommendation}`
        : `Mulai dari ${top.project.title} (deadline ${formatLongDate(top.project.deadline, false)}). Untuk deadline yang bertabrakan pada ${formatLongDate(firstTie.deadline, false)}: ${firstTie.recommendation}`;
    if (ties.length > 1) {
      recommendation +=
        lang === "en"
          ? ` There ${ties.length - 1 === 1 ? "is" : "are"} ${ties.length - 1} other conflicting date${ties.length - 1 === 1 ? "" : "s"} to protect.`
          : ` Ada ${ties.length - 1} tanggal benturan lain yang juga perlu dijaga.`;
    }
    const hasBufferMention =
      lang === "en" ? /buffer/i.test(firstTie.recommendation) : /cadangan/i.test(firstTie.recommendation);
    if (!hasBufferMention) {
      recommendation +=
        lang === "en"
          ? " After this order, keep a buffer for QC and delivery."
          : " Setelah urutan ini, sisakan cadangan untuk QC dan pengiriman.";
    }
  } else {
    const second = items[1];
    recommendation =
      lang === "en"
        ? `Start with ${top.project.title} (deadline ${formatLongDate(top.project.deadline, false, lang)}, ${
            top.daysToDeadline >= 0
              ? `${top.daysToDeadline} days left`
              : `${Math.abs(top.daysToDeadline)} days overdue`
          }). ${top.remainingDuration} working ${
            top.remainingDuration === 1 ? "day" : "days"
          } left, ${top.remainingTaskCount} ${
            top.remainingTaskCount === 1 ? "task" : "tasks"
          }, and ${top.bufferRemaining} buffer ${
            top.bufferRemaining === 1 ? "day" : "days"
          }.${
            top.lateCount > 0
              ? top.lateCount === 1
                ? " 1 late task needs to be cleared first."
                : ` ${top.lateCount} late tasks need to be cleared first.`
              : ""
          }${second ? ` After that, prepare ${second.project.title} (deadline ${formatShortDate(second.project.deadline, lang)}).` : ""}`
        : `Mulai dari ${top.project.title} (deadline ${formatLongDate(top.project.deadline, false)}, ${
            top.daysToDeadline >= 0
              ? `${top.daysToDeadline} hari lagi`
              : `sudah lewat ${Math.abs(top.daysToDeadline)} hari`
          }). Sisa ${top.remainingDuration} hari kerja, ${top.remainingTaskCount} tugas, dan cadangan ${top.bufferRemaining} hari.${
            top.lateCount > 0
              ? ` Ada ${top.lateCount} tugas terlambat yang perlu dibereskan lebih dulu.`
              : ""
          }${second ? ` Setelah itu siapkan ${second.project.title} (deadline ${formatShortDate(second.project.deadline)}).` : ""}`;
  }

  return {
    items,
    completedCount,
    ties,
    hasTies: ties.length > 0,
    headline: top
      ? lang === "en"
        ? `Main focus: ${top.project.title}`
        : `Fokus utama: ${top.project.title}`
      : translate(lang, "Semua proyek sudah tuntas"),
    recommendation,
  };
}
