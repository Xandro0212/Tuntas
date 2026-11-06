import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListOrdered,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProjectsForUser, getProjectBundle } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { translate } from "@/lib/i18n";
import { buildPriorityPlan, type PriorityRisk } from "@/lib/priority";
import {
  formatCompactRupiah,
  formatLongDate,
  formatShortDate,
  relativeDeadline,
  todayISO,
} from "@/lib/dates";
import { CATEGORY_LABEL, phaseTone } from "@/lib/constants";
import { DeleteProjectButton } from "@/components/delete-project-button";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "Projects" : "Proyek" };
}

export default async function ProjectsPage() {
  const user = await requireUser();
  const lang = await getLang();
  const t = (source: string, vars?: Record<string, string | number>) =>
    translate(lang, source, vars);
  const projects = getProjectsForUser(user.id, lang);
  const bundles = projects.map((project) => getProjectBundle(user.id, project.id, lang)!);
  const today = todayISO();

  const totalTasks = bundles.reduce((sum, bundle) => sum + bundle.tasks.length, 0);
  const doneTasks = bundles.reduce((sum, bundle) => sum + bundle.summary.done, 0);
  const active = bundles.filter(
    (bundle) => bundle.summary.done < bundle.summary.total,
  ).length;
  const totalValue = projects.reduce((sum, project) => sum + (project.value ?? 0), 0);
  const nearest = [...projects].sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const priority = buildPriorityPlan(
    bundles.map((bundle) => ({
      project: bundle.project,
      tasks: bundle.tasks,
      summary: bundle.summary,
    })),
    lang,
  );
  const tieDeadlines = new Set(priority.ties.map((tie) => tie.deadline));
  const riskStyle: Record<PriorityRisk, string> = {
    kritis: "bg-rust-soft text-rust",
    tinggi: "bg-gold-soft text-gold",
    sedang: "bg-blue-soft text-blue",
    aman: "bg-green-soft text-green",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="section-title">{t("Ruang kerja {name}", { name: user.businessName })}</div>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.04em] sm:text-[32px]">
            {t("Semua proyek")}
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {t(
              "{count} proyek · {active} masih berjalan. Semua deadline dihitung dengan cadangan waktu.",
              { count: projects.length, active },
            )}
          </p>
        </div>
        <Link href="/proyek/baru" className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> {t("Proyek baru")}
        </Link>
      </div>

      <section className="panel relative overflow-hidden p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-green/10 blur-3xl" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-green">
              <ListOrdered className="h-3.5 w-3.5" /> {t("Estimasi prioritas")}
            </div>
            <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.03em] text-ink sm:text-[22px]">
              {priority.headline}
            </h2>
            <p className="mt-1 text-[11.5px] text-muted">
              {t("Urutan berdasarkan deadline, sisa durasi, progres, dan cadangan waktu.")}
            </p>
          </div>
          <span className="chip-sm shrink-0 border border-green/20 bg-green-soft text-green">
            <Sparkles className="h-3 w-3" /> {t("Rekomendasi AI")}
          </span>
        </div>

        <div className="relative mt-4 grid min-w-0 gap-3.5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-2">
            {priority.items.map((item) => (
              <Link
                key={item.project.id}
                href={`/proyek/${item.project.id}`}
                className="group flex w-full min-w-0 items-start gap-3 rounded-xl border border-line bg-card p-3 transition hover:border-green/30 hover:bg-paper"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-[12px] font-extrabold ${
                    item.order === 1
                      ? "border-green/30 bg-green text-white shadow-[0_8px_18px_-10px_rgba(109,40,217,0.5)]"
                      : "border-line bg-paper text-ink-2"
                  }`}
                >
                  {item.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="min-w-0 truncate text-[12.5px] font-bold text-ink">
                      {item.project.title}
                    </span>
                    <span className={`chip-sm shrink-0 ${riskStyle[item.risk]}`}>{item.riskLabel}</span>
                    {tieDeadlines.has(item.project.deadline) && (
                      <span className="chip-sm shrink-0 bg-violet-soft text-violet">{t("Deadline sama")}</span>
                    )}
                  </div>
                  <div className="mt-0.5 min-w-0 truncate text-[10px] text-muted">
                    {item.project.clientName} · {item.reason}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="progress-track flex-1">
                      <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className="shrink-0 text-[9px] font-bold text-ink-2">
                      {item.progress}%
                    </span>
                  </div>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <div className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-green">
                    {item.focusLabel}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted">
                    {item.daysToDeadline >= 0
                      ? item.daysToDeadline === 1
                        ? t("1 hari lagi")
                        : t("{n} hari lagi", { n: item.daysToDeadline })
                      : Math.abs(item.daysToDeadline) === 1
                        ? t("lewat 1 hari")
                        : t("lewat {n} hari", { n: Math.abs(item.daysToDeadline) })}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[9px] text-muted">
                    <Clock3 className="h-2.5 w-2.5" />{" "}
                    {item.remainingDuration === 1
                      ? t("1 hari kerja")
                      : t("{n} hari kerja", { n: item.remainingDuration })}
                  </div>
                </div>
              </Link>
            ))}
            {!priority.items.length && (
              <div className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[11px] text-muted">
                {t("Semua proyek sudah selesai. Tidak ada prioritas aktif.")}
              </div>
            )}
          </div>

          <div className="min-w-0 rounded-2xl border border-green/20 bg-green-soft p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-green">
              <Sparkles className="h-3.5 w-3.5" /> {t("Saran AI")}
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
              {priority.recommendation}
            </p>

            <div className="mt-3 border-t border-green/15 pt-2.5">
              {priority.ties.length ? (
                <div className="space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-green/70">
                    {t("Deadline bertabrakan")}
                  </div>
                  {priority.ties.map((tie) => (
                    <div key={tie.deadline} className="rounded-lg bg-white/70 px-2.5 py-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink">
                        <AlertTriangle className="h-3 w-3 text-gold" />
                        {formatLongDate(tie.deadline, false, lang)}
                      </div>
                      <div className="mt-0.5 text-[9.5px] leading-relaxed text-ink-2/80">
                        {tie.items.map((item) => item.project.title).join(" · ")}
                      </div>
                      <p className="mt-1 line-clamp-3 text-[9px] leading-relaxed text-ink-2/70">
                        {tie.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-start gap-1.5 text-[9.5px] leading-relaxed text-ink-2/70">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-green" />
                  {t(
                    "Belum ada deadline yang bertabrakan. Kalau nanti ada dua proyek di tanggal yang sama, AI akan menyarankan urutan dan pembagian tim di sini.",
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-green/15 pt-2.5 text-[8.5px] text-green/70">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-2.5 w-2.5" />{" "}
                {priority.items.length === 1
                  ? t("1 proyek aktif")
                  : t("{n} proyek aktif", { n: priority.items.length })}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" />{" "}
                {priority.completedCount === 1
                  ? t("1 selesai")
                  : t("{n} selesai", { n: priority.completedCount })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-[18px] bg-[linear-gradient(140deg,#7c3aed_0%,#6425c9_55%,#4c1d95_100%)] px-4 py-4 text-white shadow-[0_22px_40px_-24px_rgba(76,29,149,0.7)]">
          <div className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                {t("Proyek aktif")}
              </span>
              <div className="mt-2 text-[24px] font-extrabold tracking-[-0.03em]">{active}</div>
              <div className="text-[10.5px] text-white/70">
                {t("dari {n} proyek", { n: projects.length })}
              </div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white">
              <FolderKanban className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="panel overflow-hidden px-4 py-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-blue/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="section-title">{t("Tugas selesai")}</span>
              <div className="mt-2 text-[24px] font-extrabold tracking-[-0.03em]">
                {doneTasks}
                <span className="text-[11px] font-semibold text-muted">/{totalTasks}</span>
              </div>
              <div className="progress-track mt-1.5">
                <div
                  className="progress-fill"
                  style={{ width: `${totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0}%` }}
                />
              </div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue/25 bg-blue-soft text-blue">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="panel overflow-hidden px-4 py-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-violet/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <span className="section-title">{t("Modal proyek")}</span>
              <div className="mt-2 whitespace-nowrap text-[20px] font-extrabold tracking-[-0.03em] sm:text-[24px]">
                {formatCompactRupiah(totalValue, lang)}
              </div>
              <div className="text-[10.5px] text-muted">{t("total modal tercatat")}</div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet/25 bg-violet-soft text-violet">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className="panel overflow-hidden px-4 py-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-rust/15 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="section-title">{t("Deadline terdekat")}</span>
              <div className="mt-2 text-[24px] font-extrabold tracking-[-0.03em]">
                {nearest ? formatShortDate(nearest.deadline, lang) : "—"}
              </div>
              <div className="truncate text-[10.5px] text-muted">
                {nearest ? relativeDeadline(nearest.deadline, lang) : t("belum ada proyek")}
              </div>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rust/25 bg-rust-soft text-rust">
              <CalendarDays className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {projects.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bundles.map((bundle) => {
            const { project, phases, summary } = bundle;
            const done = summary.total > 0 && summary.done === summary.total;
            const late = project.deadline < today && !done;
            return (
              <article
                key={project.id}
                className="panel group flex min-w-0 flex-col p-4 transition hover:-translate-y-0.5 hover:border-green/30 hover:shadow-[0_24px_50px_-30px_rgba(76,29,149,0.35)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="chip-sm bg-paper-2 text-ink-2">
                    {t(CATEGORY_LABEL[project.category])}
                  </span>
                  <span
                    className={`chip-sm ${
                      done
                        ? "bg-violet-soft text-violet"
                        : late
                          ? "bg-rust-soft text-rust"
                          : "bg-green-soft text-green"
                    }`}
                  >
                    {done ? t("Selesai") : late ? t("Lewat deadline") : t("Aktif")}
                  </span>
                </div>

                <h2 className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.015em]">
                  {project.title}
                </h2>
                <div className="mt-1 text-[11.5px] text-muted">{project.clientName}</div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {phases.map((phase, index) => {
                    const tone = phaseTone(phase.name, index);
                    return (
                      <span
                        key={phase.id}
                        className="h-1.5 w-5 rounded-full"
                        style={{ background: tone.dot }}
                        title={phase.name}
                      />
                    );
                  })}
                </div>

                <div className="mt-3.5">
                  <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                    <span className="font-semibold text-ink-2">
                      {t("{done}/{total} tugas", { done: summary.done, total: summary.total })}
                    </span>
                    <span className="font-bold text-green">{summary.progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${summary.progress}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-[10.5px]">
                  <span className={`min-w-0 truncate ${late ? "font-semibold text-rust" : "text-muted"}`}>
                    {formatLongDate(project.deadline, false, lang)} ·{" "}
                    {relativeDeadline(project.deadline, lang)}
                  </span>
                  {project.value ? (
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold text-ink-2">
                      <Wallet className="h-3 w-3" /> {formatCompactRupiah(project.value, lang)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/proyek/${project.id}`}
                    className="btn-secondary btn-sm flex-1 justify-between"
                  >
                    {t("Buka papan")} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/proyek/${project.id}/kalender`}
                    className="btn-ghost btn-sm px-2.5"
                    title={t("Buka kalender")}
                    aria-label={t("Kalender {title}", { title: project.title })}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Link>
                  <DeleteProjectButton
                    projectId={project.id}
                    projectTitle={project.title}
                    className="btn-ghost btn-sm px-2.5 text-muted hover:bg-rust-soft hover:text-rust"
                  />
                </div>
              </article>
            );
          })}

          <Link
            href="/proyek/baru"
            className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-card p-6 text-center transition hover:border-green/45 hover:bg-paper"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-green">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-[13px] font-bold">{t("Proyek baru")}</span>
            <span className="max-w-[190px] text-[11px] leading-relaxed text-muted">
              {t("Ceritakan pesanan klien, AI memecahnya jadi tugas dan jadwal.")}
            </span>
          </Link>
        </div>
      ) : (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-green">
            <FolderKanban className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-[18px] font-bold">{t("Belum ada proyek")}</h2>
          <p className="mt-1 max-w-[380px] text-[12px] leading-relaxed text-muted">
            {t(
              "Mulai dengan menceritakan pesanan klien. AI akan menyusun tahap, tugas, dan tanggal mundur dari deadline.",
            )}
          </p>
          <Link href="/proyek/baru" className="btn-primary mt-4">
            <Plus className="h-4 w-4" /> {t("Buat proyek pertama")}
          </Link>
        </div>
      )}
    </div>
  );
}
