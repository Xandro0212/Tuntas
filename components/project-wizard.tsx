"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  ClipboardPaste,
  FileText,
  GripVertical,
  Hammer,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  Users,
  UtensilsCrossed,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "./language-provider";
import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  TASK_TYPE_LABEL,
  WORKDAY_LABELS,
  phaseTone,
} from "@/lib/constants";
import { PROJECT_DEMOS, type ProjectDemo } from "@/lib/demo-presets";
import { SpeechToText } from "./speech-to-text";
import {
  addDays,
  formatDateRange,
  formatLongDate,
  formatShortDate,
  todayISO,
} from "@/lib/dates";
import { scheduleTasks } from "@/lib/schedule";
import type {
  AiPlan,
  AiQuestion,
  Attachment,
  Category,
  DraftTask,
  Holiday,
  PublicUser,
  TaskType,
} from "@/lib/types";

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  kerajinan: Hammer,
  katering: UtensilsCrossed,
  konveksi: Shirt,
  jasa: Briefcase,
  lainnya: Sparkles,
};

const DEMO_TONE: Record<Category, string> = {
  kerajinan: "bg-gold-soft text-gold",
  katering: "bg-rust-soft text-rust",
  konveksi: "bg-blue-soft text-blue",
  jasa: "bg-violet-soft text-violet",
  lainnya: "bg-paper-2 text-muted",
};

const STEPS = [
  { number: 1, label: "Cerita proyek" },
  { number: 2, label: "Jawab pertanyaan" },
  { number: 3, label: "Cek rencana" },
  { number: 4, label: "Mulai kerja" },
];

interface WizardForm {
  category: Category;
  title: string;
  clientName: string;
  clientWa: string;
  deadline: string;
  deadlineTime: string;
  story: string;
  value: string;
  team: string[];
  workdays: number[];
}

export function ProjectWizard({
  user,
  holidays,
  defaultTeam,
  defaultWorkdays,
  autoFocusStory,
}: {
  user: PublicUser;
  holidays: Holiday[];
  defaultTeam: string[];
  defaultWorkdays: number[];
  autoFocusStory?: boolean;
}) {
  const { lang, t } = useI18n();
  const today = todayISO();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>({
    category: "kerajinan",
    title: "",
    clientName: "",
    clientWa: "",
    deadline: "",
    deadlineTime: "11:00",
    story: "",
    value: "",
    team: defaultTeam,
    workdays: defaultWorkdays.filter((day) => day !== 0),
  });
  const [teamInput, setTeamInput] = useState("");
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phases, setPhases] = useState<{ id: string; name: string }[]>([]);
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [engine, setEngine] = useState<"demo" | "llm">("demo");
  const [loading, setLoading] = useState<"questions" | "plan" | "apply" | null>(null);
  const [error, setError] = useState("");
  const [scheduleWarningDismissed, setScheduleWarningDismissed] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScheduleWarningDismissed(false);
  }, [draftTasks, form.deadline]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const schedule = useMemo(
    () =>
      scheduleTasks({
        deadline: form.deadline || today,
        workdays: form.workdays.length ? form.workdays : [1, 2, 3, 4, 5, 6],
        holidays: holidays.map((holiday) => holiday.date),
        tasks: draftTasks.map((task, index) => ({
          id: task.tempId,
          durationDays: Math.max(1, task.durationDays),
          dependsOn: task.dependsOn,
          order: index + 1,
        })),
      }),
    [draftTasks, form.deadline, form.workdays, holidays, today],
  );

  const deadlineLabel = form.deadline
    ? formatLongDate(form.deadline, false, lang)
    : t("belum diisi");
  const activeCategory = CATEGORY_OPTIONS.find((option) => option.id === form.category);

  function payload() {
    return {
      category: form.category,
      title: form.title,
      clientName: form.clientName,
      clientWa: form.clientWa,
      deadline: form.deadline,
      story: form.story,
      team: form.team,
      workdays: form.workdays,
      value: form.value ? Number(form.value) : undefined,
    };
  }

  function applyDemo(demo: ProjectDemo) {
    setForm((current) => ({
      ...current,
      category: demo.category,
      title: demo.title[lang],
      clientName: demo.clientName,
      clientWa: demo.clientWa,
      deadline: addDays(today, demo.deadlineOffset),
      deadlineTime: demo.deadlineTime ?? "11:00",
      story: demo.story[lang],
      value: String(demo.value),
      team: demo.team,
      workdays: current.workdays.length ? current.workdays : [1, 2, 3, 4, 5, 6],
    }));
    setActiveDemo(demo.id);
    setError("");
    toast.success(t("Demo dimuat. Kamu bisa mengubahnya sebelum menyusun rencana."));
  }

  function appendStory(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setForm((current) => ({
      ...current,
      story: `${current.story}${current.story ? " " : ""}${clean}`.slice(0, 6000),
    }));
  }

  function validate() {
    if (form.title.trim().length < 2) return t("Nama proyek wajib diisi.");
    if (form.clientName.trim().length < 2) return t("Nama klien wajib diisi.");
    if (form.clientWa.replace(/\D/g, "").length < 8)
      return t("Nomor WhatsApp klien perlu diisi minimal 8 digit.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.deadline)) return t("Deadline klien wajib diisi.");
    if (form.deadline < today) return t("Deadline tidak boleh di masa lalu.");
    if (form.story.trim().length < 10) return t("Ceritakan proyeknya sedikit lebih lengkap.");
    if (!form.workdays.length) return t("Pilih minimal satu hari kerja.");
    return "";
  }

  async function askQuestions(event?: React.FormEvent) {
    event?.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }
    setError("");
    setLoading("questions");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "questions", ...payload() }),
      });
      const data = (await response.json()) as {
        error?: string;
        questions?: AiQuestion[];
        engine?: "demo" | "llm";
      };
      if (!response.ok || !data.questions) {
        throw new Error(data.error ? t(data.error) : t("AI belum bisa membaca cerita ini."));
      }
      setQuestions(data.questions);
      setEngine(data.engine === "llm" ? "llm" : "demo");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("AI belum bisa membaca cerita ini."));
    } finally {
      setLoading(null);
    }
  }

  async function generatePlan(skipAnswers = false) {
    setError("");
    setLoading("plan");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "plan",
          ...payload(),
          answers: skipAnswers ? {} : answers,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        plan?: AiPlan;
        engine?: "demo" | "llm";
        fallback?: boolean;
      };
      if (!response.ok || !data.plan) {
        throw new Error(data.error ? t(data.error) : t("AI belum bisa menyusun rencana."));
      }
      if (data.fallback) {
        toast.warning(
          t("AI eksternal sedang tidak tersedia. Rencana disusun dengan planner lokal."),
        );
      }
      const plan = data.plan;
      setEngine(data.engine === "llm" ? "llm" : "demo");
      setPhases(plan.phases);
      const phaseIndex = new Map(plan.phases.map((phase, index) => [phase.id, index]));
      setDraftTasks(
        plan.tasks.map((task) => ({
          tempId: task.id,
          phaseIndex: phaseIndex.get(task.phase) ?? 0,
          title: task.title,
          type: task.type,
          durationDays: task.duration_days,
          dependsOn: task.depends_on,
          assignee: task.assignee,
          source: "ai" as const,
        })),
      );
      setRisks(plan.risks);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("AI belum bisa menyusun rencana."));
    } finally {
      setLoading(null);
    }
  }

  async function applyToKanban() {
    if (!draftTasks.length) {
      toast.error(t("Rencana masih kosong."));
      return;
    }
    if (draftTasks.some((task) => task.title.trim().length < 2)) {
      toast.error(t("Masih ada tugas dengan judul kosong."));
      return;
    }
    setLoading("apply");
    setError("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload(),
          value: Number(form.value) || 0,
          deadlineTime: form.category === "katering" ? form.deadlineTime : undefined,
          attachments,
          phases: phases.map((phase) => ({ name: phase.name })),
          tasks: draftTasks.map((task) => ({
            ...task,
            source: task.source,
          })),
        }),
      });
      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !data.id)
        throw new Error(data.error ? t(data.error) : t("Gagal menerapkan rencana."));
      toast.success(t("Rencana diterapkan. Selamat bekerja!"));
      window.location.href = `/proyek/${data.id}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Gagal menerapkan rencana.");
      setError(message);
      toast.error(message);
      setLoading(null);
    }
  }

  function updateTask(tempId: string, patch: Partial<DraftTask>) {
    setDraftTasks((current) =>
      current.map((task) => (task.tempId === tempId ? { ...task, ...patch } : task)),
    );
  }

  function removeTask(tempId: string) {
    setDraftTasks((current) =>
      current
        .filter((task) => task.tempId !== tempId)
        .map((task) => ({
          ...task,
          dependsOn: task.dependsOn.filter((dep) => dep !== tempId),
        })),
    );
  }

  function addTask(phaseIndex: number) {
    const tempId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setDraftTasks((current) => [
      ...current,
      {
        tempId,
        phaseIndex,
        title: t("Tugas baru"),
        type: "internal",
        durationDays: 1,
        dependsOn: [],
        assignee: form.team[0] ?? t("Saya"),
        source: "manual",
      },
    ]);
  }

  function addTeamMember() {
    const name = teamInput.trim();
    if (!name) return;
    if (form.team.some((member) => member.toLowerCase() === name.toLowerCase())) {
      setTeamInput("");
      return;
    }
    setForm((current) => ({ ...current, team: [...current.team, name] }));
    setTeamInput("");
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const uploaded: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("{name} lebih dari 5 MB.", { name: file.name }));
        continue;
      }
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body });
        const data = (await response.json()) as { error?: string; url?: string; name?: string; size?: number };
        if (!response.ok || !data.url)
          throw new Error(data.error ? t(data.error) : t("Gagal mengunggah."));
        uploaded.push({ url: data.url, name: data.name ?? file.name, size: data.size ?? file.size });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("Gagal mengunggah {name}.", { name: file.name }),
        );
      }
    }
    setAttachments((current) => [...current, ...uploaded].slice(0, 8));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function pasteWhatsApp() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error(t("Clipboard masih kosong."));
        return;
      }
      setForm((current) => ({
        ...current,
        story: `${current.story}${current.story ? "\n\n" : ""}${text}`.slice(0, 6000),
      }));
      toast.success(t("Chat WhatsApp ditempel ke cerita."));
    } catch {
      toast.error(t("Clipboard tidak bisa dibaca. Tempel manual dengan Ctrl+V."));
    }
  }

  const title =
    step === 1
      ? t("Ceritakan proyekmu, AI yang susun jadwalnya")
      : step === 2
        ? t("AI butuh sedikit konfirmasi")
        : t("Cek rencananya, lalu terapkan ke Kanban");
  const subtitle =
    step === 1
      ? t(
          "Tulis seperti sedang menjelaskan pesanan ke karyawan. AI akan memecahnya menjadi tugas, tanggal dihitung mundur dari deadline.",
        )
      : step === 2
        ? t(
            "Jawaban ini menentukan tugas dan durasi yang dibuat. Kalau tidak yakin, lewati saja — kami pakai asumsi aman.",
          )
        : t(
            "Semua tugas masih bisa diedit, dihapus, atau ditambah. Setelah diterapkan, tugas masuk ke kolom Belum mulai.",
          );

  return (
    <div className="mx-auto w-full max-w-[1220px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="section-title">
            {t("Proyek baru · {name}", { name: user.businessName })}
          </div>
          <h1 className="mt-1.5 max-w-[780px] text-[25px] font-extrabold leading-[1.15] tracking-[-0.04em] sm:text-[31px]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-[780px] text-[12.5px] leading-relaxed text-muted">{subtitle}</p>
        </div>
        <Link href="/proyek" className="btn-secondary btn-sm w-fit shrink-0 self-start sm:self-auto">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("Batal")}
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((item, index) => {
          const active = step === item.number;
          const done = step > item.number;
          return (
            <div key={item.number} className="flex shrink-0 items-center gap-1">
              {index > 0 && <div className={`h-px w-5 sm:w-8 ${done || active ? "bg-green/40" : "bg-line"}`} />}
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-green text-white shadow-sm"
                    : done
                      ? "bg-mint text-green"
                      : "bg-card text-muted ring-1 ring-line"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    active ? "bg-white/20" : done ? "bg-green text-white" : "bg-paper-2"
                  }`}
                >
                  {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : item.number}
                </span>
                {t(item.label)}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-3.5 py-2.5 text-[12px] text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {step === 1 && (
        <section className="panel mt-4 overflow-hidden p-3.5 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-green">
                <Sparkles className="h-3.5 w-3.5" /> {t("Demo siap pakai")}
              </div>
              <h2 className="mt-1 text-[14.5px] font-bold text-ink">
                {t("Pilih contoh sesuai kategori")}
              </h2>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                {t("Form terisi otomatis. Kamu tetap bisa mengubah semua isinya.")}
              </p>
            </div>
            <span className="chip-sm shrink-0 bg-green-soft text-green">
              {PROJECT_DEMOS.length} {t("demo")}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {PROJECT_DEMOS.map((demo) => {
              const Icon = CATEGORY_ICONS[demo.category];
              const active = activeDemo === demo.id;
              return (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => applyDemo(demo)}
                  className={`group rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-green bg-green-soft shadow-[0_10px_24px_-18px_rgba(76,29,149,0.5)]"
                      : "border-line bg-paper hover:border-green/35 hover:bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${DEMO_TONE[demo.category]}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate text-[8.5px] font-bold uppercase tracking-[0.08em] text-muted">
                      {t(CATEGORY_LABEL[demo.category])}
                    </span>
                  </div>
                  <div className="mt-2 line-clamp-2 text-[11.5px] font-bold leading-snug text-ink">
                    {demo.title[lang]}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[9.5px] text-muted">
                    <span>{t("Deadline {n} hari", { n: demo.deadlineOffset })}</span>
                    <span className="shrink-0 font-semibold text-green group-hover:underline">
                      {t("Pakai demo")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 1 && (
        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <form onSubmit={askQuestions} className="panel p-4 sm:p-5">
            <div>
              <span className="label">{t("Jenis pekerjaan")}</span>
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                {CATEGORY_OPTIONS.map((option) => {
                  const Icon = CATEGORY_ICONS[option.id];
                  const active = form.category === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setForm({ ...form, category: option.id })}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-[11.5px] font-semibold transition ${
                        active
                          ? "border-green bg-green text-white shadow-sm"
                          : "border-line bg-card text-ink-2 hover:border-line-strong hover:bg-paper"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {t(option.label)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10.5px] text-muted">
                {activeCategory ? t(activeCategory.hint) : ""}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="wizard-title">
                  {t("Nama proyek")} <span className="text-rust">*</span>
                </label>
                <input
                  id="wizard-title"
                  className="field"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder={t("mis. Patung kuda - Kantor Dinas")}
                />
              </div>
              <div>
                <label className="label" htmlFor="wizard-client">
                  {t("Nama klien")} <span className="text-rust">*</span>
                </label>
                <input
                  id="wizard-client"
                  className="field"
                  value={form.clientName}
                  onChange={(event) => setForm({ ...form, clientName: event.target.value })}
                  placeholder={t("mis. Bu Ayu")}
                />
              </div>
              <div>
                <label className="label" htmlFor="wizard-wa">
                  {t("No. WhatsApp klien")} <span className="text-rust">*</span>
                </label>
                <input
                  id="wizard-wa"
                  className="field"
                  inputMode="tel"
                  value={form.clientWa}
                  onChange={(event) => setForm({ ...form, clientWa: event.target.value })}
                  placeholder="0812 3456 7890"
                />
              </div>
              <div>
                <label className="label" htmlFor="wizard-deadline">
                  {t("Deadline klien")} <span className="text-rust">*</span>
                </label>
                <input
                  id="wizard-deadline"
                  type="date"
                  min={today}
                  className="field"
                  value={form.deadline}
                  onChange={(event) => setForm({ ...form, deadline: event.target.value })}
                  onInput={(event) =>
                    setForm((current) => ({
                      ...current,
                      deadline: (event.target as HTMLInputElement).value,
                    }))
                  }
                />
              </div>
              {form.category === "katering" && (
                <div>
                  <label className="label" htmlFor="wizard-time">
                    {t("Jam acara / tiba di lokasi")}
                  </label>
                  <input
                    id="wizard-time"
                    type="time"
                    className="field"
                    value={form.deadlineTime}
                    onChange={(event) => setForm({ ...form, deadlineTime: event.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="label" htmlFor="wizard-value">
                  {t("Modal proyek")} ({t("opsional")})
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted">
                    Rp
                  </span>
                  <input
                    id="wizard-value"
                    type="number"
                    min={0}
                    step={1000}
                    className="field pl-9"
                    value={form.value}
                    onChange={(event) => setForm({ ...form, value: event.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-end justify-between gap-3">
                <label className="label mb-0" htmlFor="wizard-story">
                  {t("Ceritakan proyeknya")} <span className="text-rust">*</span>
                </label>
                <span className="text-[10px] text-muted">{form.story.length}/6000</span>
              </div>
              <textarea
                id="wizard-story"
                className="field mt-1.5 min-h-[170px] resize-y leading-relaxed"
                maxLength={6000}
                autoFocus={autoFocusStory}
                placeholder={t(
                  "Ceritakan pesanan seperti ke karyawan: bahan, ukuran, warna, siapa yang memasang, apa yang harus disetujui klien, dan hal yang sering bikin terlambat…",
                )}
                value={form.story}
                onChange={(event) => setForm({ ...form, story: event.target.value })}
              />
              <SpeechToText onTranscript={appendStory} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-xs border border-line bg-card text-ink-2 hover:bg-paper"
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                  {t("Foto / referensi")}
                </button>
                <button
                  type="button"
                  onClick={pasteWhatsApp}
                  className="btn btn-xs border border-line bg-card text-ink-2 hover:bg-paper"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" /> {t("Tempel chat WhatsApp klien")}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                  onChange={(event) => uploadFiles(event.target.files)}
                />
              </div>

              {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <div
                      key={file.url}
                      className="flex items-center gap-2 rounded-lg border border-line bg-paper/60 py-1 pl-1 pr-2"
                    >
                      {/\.(png|jpe?g|webp|gif)$/i.test(file.previewUrl ?? file.url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.previewUrl ?? file.url}
                          alt={file.name}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-card text-muted">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="max-w-[140px] truncate text-[10.5px] font-medium text-ink-2">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        className="text-muted hover:text-danger"
                        onClick={() =>
                          setAttachments((current) =>
                            current.filter((item) => item.url !== file.url),
                          )
                        }
                        aria-label={t("Hapus {name}", { name: file.name })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <span className="label">{t("Tim yang mengerjakan")}</span>
                <div className="flex gap-1.5">
                  <input
                    className="field-sm flex-1"
                    value={teamInput}
                    onChange={(event) => setTeamInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTeamMember();
                      }
                    }}
                    placeholder={t("Nama anggota tim")}
                  />
                  <button type="button" className="btn-secondary btn-sm px-2.5" onClick={addTeamMember}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {form.team.map((member) => (
                    <span
                      key={member}
                      className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[10.5px] font-semibold text-ink-2"
                    >
                      {member}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            team: current.team.filter((name) => name !== member),
                          }))
                        }
                        aria-label={t("Hapus {name}", { name: member })}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {!form.team.length && (
                    <span className="text-[10px] text-muted">
                      {t("Kosongkan kalau kamu sendiri.")}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="label">{t("Hari kerja")}</span>
                <div className="flex flex-wrap gap-1">
                  {WORKDAY_LABELS.map((day) => {
                    const active = form.workdays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            workdays: active
                              ? current.workdays.filter((item) => item !== day.id)
                              : [...current.workdays, day.id].sort(),
                          }))
                        }
                        className={`flex h-7 w-9 items-center justify-center rounded-md border text-[10px] font-bold transition ${
                          active
                            ? "border-green bg-mint text-green"
                            : "border-line bg-card text-muted hover:border-line-strong"
                        }`}
                      >
                        {t(day.label)}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  {t("Minggu selalu libur. Hari libur lain dicek otomatis.")}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10.5px] leading-relaxed text-muted">
                {t("AI hanya memecah tugas. Tanggal dihitung sistem, bukan dikarang AI.")}
              </p>
              <button type="submit" className="btn-primary shrink-0" disabled={loading !== null}>
                {loading === "questions" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("AI membaca cerita…")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> {t("Susun rencana dengan AI")}
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="space-y-3 xl:sticky xl:top-6">
            <div className="panel p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint text-green">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {t("Langkah 2")}
                  </div>
                  <div className="text-[13px] font-bold text-ink">{t("AI perlu tahu 3 hal")}</div>
                </div>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                {t(
                  "Supaya tidak salah bagi tugas, AI akan bertanya singkat soal pemasangan, persetujuan klien, dan kesiapan bahan.",
                )}
              </p>
              <div className="mt-3 space-y-2">
                {[
                  {
                    q: t("Pemasangan di lokasi termasuk tugasmu?"),
                    a: [t("Ya, tim saya"), lang === "en" ? "Client" : "Klien", "Vendor"],
                  },
                  {
                    q: t("Berapa lama klien memberi persetujuan?"),
                    a: [t("1 hari"), t("2–3 hari"), t("Seminggu")],
                  },
                  {
                    q: t("Bahan baku sudah tersedia?"),
                    a: [t("Siap"), t("Sebagian"), t("Belum")],
                  },
                ].map((item) => (
                  <div key={item.q} className="rounded-xl border border-line bg-paper/50 p-2.5">
                    <div className="text-[11px] font-semibold leading-snug text-ink-2">{item.q}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.a.map((option) => (
                        <span
                          key={option}
                          className="rounded-full border border-line bg-card px-2 py-0.5 text-[9.5px] font-medium text-muted"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-green/25 bg-green-soft p-4">
              <div className="pointer-events-none absolute -right-10 -top-14 h-28 w-28 rounded-full bg-green/20 blur-3xl" />
              <div className="relative flex items-center gap-2 text-[12px] font-bold text-ink">
                <Wand2 className="h-4 w-4 text-green" /> {t("Tanggal tidak dikarang AI")}
              </div>
              <div className="relative mt-2 space-y-1.5 text-[10.5px] leading-relaxed text-muted">
                <p>• {t("Dihitung mundur dari deadline klien.")}</p>
                <p>• {t("Minggu dan hari libur dilewati.")}</p>
                <p>• {t("Cadangan 10% durasi, minimal 1 hari kerja.")}</p>
                <p>• {t("Kamu tetap pemutus akhir sebelum masuk Kanban.")}</p>
              </div>
            </div>

            <div className="panel flex items-center gap-2 p-3 text-[10.5px] text-muted">
              <Check className="h-3.5 w-3.5 shrink-0 text-green" />
              {t("Data proyek & klien disimpan di Supabase.")}
            </div>
          </aside>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="panel p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="section-title">{t("Yang AI pahami")}</div>
                <h2 className="mt-1 text-[16px] font-bold leading-snug">{form.title}</h2>
              </div>
              <button type="button" className="btn-secondary btn-xs" onClick={() => setStep(1)}>
                {t("Ubah")}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10.5px]">
              <span className="chip-sm bg-paper-2 text-ink-2">
                {activeCategory ? t(activeCategory.label) : ""}
              </span>
              <span className="chip-sm bg-paper-2 text-ink-2">
                <CalendarDays className="h-3 w-3" /> {deadlineLabel}
              </span>
              {form.category === "katering" && (
                <span className="chip-sm bg-paper-2 text-ink-2">{form.deadlineTime}</span>
              )}
            </div>
            <div className="mt-3 rounded-xl bg-paper p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("Klien")}
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-ink">
                {form.clientName} · {form.clientWa}
              </div>
            </div>
            <div className="mt-2 rounded-xl bg-paper p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("Cerita")}
              </div>
              <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-[11.5px] leading-relaxed text-ink-2">
                {form.story}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-muted">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {form.team.join(", ") || t("Saya sendiri")}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />{" "}
                {form.workdays
                  .map((day) => {
                    const label = WORKDAY_LABELS.find((item) => item.id === day)?.label;
                    return label ? t(label) : undefined;
                  })
                  .filter(Boolean)
                  .join(", ")}
              </span>
              {attachments.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />{" "}
                  {attachments.length === 1
                    ? t("1 lampiran")
                    : t("{n} lampiran", { n: attachments.length })}
                </span>
              )}
            </div>
          </div>

          <div className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="section-title">{t("Langkah 2 · Maks 3 pertanyaan")}</div>
                <h2 className="mt-1 text-[17px] font-bold tracking-[-0.02em]">
                  {t("Bantu AI memutuskan pembagian tugas")}
                </h2>
              </div>
              <span className="chip-sm bg-mint text-green">
                {engine === "llm" ? "AI" : "Planner"}
              </span>
            </div>

            {loading === "plan" ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-green">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="mt-3 text-[13px] font-bold">{t("AI memecah tugas…")}</div>
                <p className="mt-1 max-w-[280px] text-[11px] leading-relaxed text-muted">
                  {t(
                    "Menyusun tahap, durasi, ketergantungan, lalu menghitung tanggal mundur dari deadline.",
                  )}
                </p>
                <div className="mt-5 w-full max-w-[320px] space-y-2">
                  {[80, 62, 70, 48].map((width, index) => (
                    <div
                      key={index}
                      className="h-7 animate-pulse rounded-lg bg-paper-2"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {questions.map((question, index) => (
                    <div key={question.id} className="rounded-xl border border-line p-3">
                      <div className="text-[12px] font-semibold leading-snug text-ink">
                        <span className="mr-1.5 text-muted">{index + 1}.</span>
                        {question.text}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {question.options.map((option) => {
                          const selected = answers[question.id] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAnswers((current) => ({ ...current, [question.id]: option }))
                              }
                              className={`chip text-[11px] ${
                                selected ? "chip-active" : "hover:border-line-strong hover:bg-paper"
                              }`}
                            >
                              {selected && <Check className="h-3 w-3" />}
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="btn-ghost btn-sm text-muted"
                    onClick={() => generatePlan(true)}
                    disabled={loading !== null}
                  >
                    {t("Lewati, pakai asumsi")}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => generatePlan(false)}
                    disabled={loading !== null}
                  >
                    <Sparkles className="h-4 w-4" /> {t("Susun rencana")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(300px,0.72fr)]">
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <div className="section-title">{t("Langkah 3 · Draf rencana")}</div>
                <h2 className="mt-0.5 text-[15px] font-bold">
                  {t("{tasks} tugas · {phases} tahap", {
                    tasks: draftTasks.length,
                    phases: phases.length,
                  })}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip-sm bg-mint text-green">
                  {engine === "llm" ? t("Disusun AI") : t("Disusun planner")}
                </span>
                <span className="text-[10px] text-muted">
                  {formatShortDate(schedule.projectStart, lang)}–
                  {formatShortDate(schedule.projectFinish, lang)}
                </span>
              </div>
            </div>

            {phases.map((phase, phaseIndex) => {
              const tone = phaseTone(phase.name, phaseIndex);
              const phaseTasks = draftTasks.filter((task) => task.phaseIndex === phaseIndex);
              return (
                <div key={`${phase.id}-${phaseIndex}`}>
                  <div className="flex items-center justify-between border-b border-line bg-paper/60 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
                      <span className="text-[11.5px] font-bold text-ink">{phase.name}</span>
                      <span className="text-[10px] text-muted">{phaseTasks.length}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addTask(phaseIndex)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-green hover:underline"
                    >
                      <Plus className="h-3 w-3" /> {t("Tugas")}
                    </button>
                  </div>

                  {phaseTasks.map((task) => {
                    const dates = schedule.dates[task.tempId];
                    return (
                      <div
                        key={task.tempId}
                        className="border-b border-line/75 px-3 py-2.5 last:border-0 sm:px-4"
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="mt-1 h-3.5 w-3.5 shrink-0 text-line-strong" />
                          <input
                            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[12.5px] font-semibold text-ink outline-none transition hover:border-line focus:border-line-strong focus:bg-card"
                            value={task.title}
                            onChange={(event) =>
                              updateTask(task.tempId, { title: event.target.value })
                            }
                          />
                          <button
                            type="button"
                            className="icon-btn h-6 w-6 shrink-0 text-muted hover:text-danger"
                            onClick={() => removeTask(task.tempId)}
                            aria-label={t("Hapus tugas")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-5">
                          <select
                            className="rounded-md border border-line bg-card px-1.5 py-1 text-[10px] font-medium text-ink-2 outline-none"
                            value={task.phaseIndex}
                            onChange={(event) =>
                              updateTask(task.tempId, {
                                phaseIndex: Number(event.target.value),
                              })
                            }
                            aria-label={t("Tahap")}
                          >
                            {phases.map((option, index) => (
                              <option key={`${option.id}-${index}`} value={index}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="rounded-md border border-line bg-card px-1.5 py-1 text-[10px] font-medium text-ink-2 outline-none"
                            value={task.type}
                            onChange={(event) =>
                              updateTask(task.tempId, { type: event.target.value as TaskType })
                            }
                            aria-label={t("Tipe tugas")}
                          >
                            {Object.entries(TASK_TYPE_LABEL).map(([value, label]) => (
                              <option key={value} value={value}>
                                {t(label)}
                              </option>
                            ))}
                          </select>
                          <input
                            className="w-[100px] rounded-md border border-line bg-card px-1.5 py-1 text-[10px] font-medium text-ink-2 outline-none"
                            value={task.assignee}
                            onChange={(event) =>
                              updateTask(task.tempId, { assignee: event.target.value })
                            }
                            list={`draft-team-${task.tempId}`}
                            aria-label={t("Penanggung jawab")}
                          />
                          <datalist id={`draft-team-${task.tempId}`}>
                            {form.team.map((member) => (
                              <option key={member} value={member} />
                            ))}
                          </datalist>
                          <label className="inline-flex items-center gap-1 rounded-md border border-line bg-card px-1.5 py-1 text-[10px] font-medium text-ink-2">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              className="w-8 bg-transparent text-center outline-none"
                              value={task.durationDays}
                              onChange={(event) =>
                                updateTask(task.tempId, {
                                  durationDays: Math.max(1, Number(event.target.value) || 1),
                                })
                              }
                              aria-label={t("Durasi hari kerja")}
                            />
                            {t("hari")}
                          </label>
                          <span className="rounded-md bg-paper px-1.5 py-1 text-[10px] font-medium text-muted">
                            {dates
                              ? formatDateRange(dates.startDate, dates.dueDate, lang)
                              : t("tanggal menyesuaikan")}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {!phaseTasks.length && (
                    <div className="border-b border-line px-4 py-3 text-[10.5px] text-muted">
                      {t("Belum ada tugas di tahap ini.")}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => addTask(0)}
              className="flex w-full items-center justify-center gap-1.5 bg-paper/40 px-4 py-3 text-[11px] font-semibold text-muted transition hover:bg-paper hover:text-green"
            >
              <Plus className="h-3.5 w-3.5" /> {t("Tambah tugas lain")}
            </button>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-6">
            <div className="panel p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[12.5px] font-bold">{t("Ringkasan jadwal")}</h3>
                <span className="text-[10px] text-muted">
                  {t("{n} tugas", { n: draftTasks.length })}
                </span>
              </div>
              <div className="mt-2.5 rounded-lg bg-paper px-2.5 py-2">
                <div className="truncate text-[11.5px] font-bold text-ink">{form.title}</div>
                <div className="truncate text-[9.5px] text-muted">
                  {form.clientName} · {formatLongDate(form.deadline, false, lang)}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-paper p-2.5">
                  <div className="text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                    {t("Target mulai")}
                  </div>
                  <div className="mt-0.5 text-[12px] font-bold">
                    {draftTasks.length ? formatShortDate(schedule.projectStart, lang) : "—"}
                  </div>
                </div>
                <div className="rounded-lg bg-paper p-2.5">
                  <div className="text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                    {t("Target selesai")}
                  </div>
                  <div className="mt-0.5 text-[12px] font-bold">
                    {draftTasks.length ? formatShortDate(schedule.projectFinish, lang) : "—"}
                  </div>
                </div>
                <div className="rounded-lg bg-paper p-2.5">
                  <div className="text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                    {t("Total durasi")}
                  </div>
                  <div className="mt-0.5 text-[12px] font-bold">
                    {t("{n} hari kerja", { n: schedule.totalDuration })}
                  </div>
                </div>
                <div className="rounded-lg bg-paper p-2.5">
                  <div className="text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                    {t("Deadline klien")}
                  </div>
                  <div className="mt-0.5 text-[12px] font-bold">
                    {form.deadline ? formatShortDate(form.deadline, lang) : "—"}
                  </div>
                </div>
              </div>
              <div className="mt-2 rounded-xl bg-mint px-3 py-2.5 text-green">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-green/65">
                  {t("Cadangan")}
                </div>
                <div className="text-[15px] font-extrabold">
                  {t("{n} hari kerja", { n: schedule.bufferDays })}
                </div>
                <div className="text-[9.5px] text-green/65">
                  {schedule.bufferDates.map((date) => formatShortDate(date, lang)).join(" · ")}
                </div>
              </div>
              {!scheduleWarningDismissed &&
                draftTasks.length > 0 &&
                schedule.projectStart < today && (
                  <div className="mt-2 rounded-lg bg-rust-soft px-2.5 py-2 text-[10px] leading-relaxed text-rust">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      <div>
                        {t(
                          "Target mulai {start} sudah lewat dari hari ini ({today}). Rencana ini butuh {n} hari kerja, jadi deadline mungkin terlalu dekat.",
                          {
                            start: formatShortDate(schedule.projectStart, lang),
                            today: formatShortDate(today, lang),
                            n: schedule.totalDuration,
                          },
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="rounded-md border border-rust/25 bg-white/60 px-2 py-1 text-[9.5px] font-bold text-rust"
                        onClick={() => setStep(1)}
                      >
                        {t("Ubah deadline")}
                      </button>
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 text-[9.5px] font-semibold text-rust/75 hover:bg-white/50"
                        onClick={() => setScheduleWarningDismissed(true)}
                      >
                        {t("Mengerti")}
                      </button>
                    </div>
                  </div>
                )}
              <div className="mt-2 text-[10px] leading-relaxed text-muted">
                {t("Deadline klien: {date}", {
                  date: formatLongDate(form.deadline, false, lang),
                })}
                {form.category === "katering" ? `, ${t("tiba")} ${form.deadlineTime}` : ""}
              </div>
            </div>

            {risks.length > 0 && (
              <div className="rounded-xl border border-rust/30 bg-rust-soft p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rust">
                  <AlertTriangle className="h-3.5 w-3.5" /> {t("Yang perlu diperhatikan")}
                </div>
                <ul className="mt-1.5 space-y-1 text-[10.5px] leading-relaxed text-rust/85">
                  {risks.map((risk) => (
                    <li key={risk} className="flex gap-1.5">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-rust/60" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="panel p-4">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={applyToKanban}
                disabled={loading !== null || !draftTasks.length}
              >
                {loading === "apply" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {loading === "apply" ? t("Menerapkan…") : t("Terapkan ke Kanban")}
              </button>
              <button
                type="button"
                className="btn-secondary mt-2 w-full"
                onClick={() => setStep(2)}
                disabled={loading !== null}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t("Ubah jawaban")}
              </button>
              <p className="mt-2 text-center text-[9.5px] leading-relaxed text-muted">
                {t("Semua tugas masuk kolom Belum mulai. Kamu bisa drag & edit setelahnya.")}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
