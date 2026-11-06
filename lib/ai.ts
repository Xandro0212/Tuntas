import type { AiPlan, AiQuestion, AiTask, Category, TaskType } from "./types";
import { translate, type Lang } from "./i18n";

export interface PlanInput {
  category: Category;
  title: string;
  story: string;
  clientName: string;
  deadline: string;
  team: string[];
  workdays: number[];
  value?: number;
}

const TYPES: TaskType[] = ["internal", "waiting_client", "vendor", "payment", "delivery"];

export function generateQuestions(input: PlanInput, lang: Lang = "id"): AiQuestion[] {
  if (lang === "en") {
    const installText =
      input.category === "katering"
        ? "Are delivery and on-site setup part of your team's job?"
        : input.category === "konveksi"
          ? "Is delivery to the client address part of your team's job?"
          : input.category === "jasa"
            ? "Are site visits and transport part of your team's job?"
            : "Are on-site installation/delivery part of your team's job?";
    return [
      {
        id: "install",
        text: installText,
        options: ["Yes, my team", "Client handles it", "Use a vendor"],
      },
      {
        id: "approval",
        text: "How long does client approval usually take?",
        options: ["1 day", "2–3 days", "A week"],
      },
      {
        id: "material",
        text:
          input.category === "katering"
            ? "Are ingredients ready?"
            : "Are raw materials and supplies ready?",
        options: ["Ready", "Partly", "Not yet, need to buy"],
      },
    ];
  }

  const installText =
    input.category === "katering"
      ? "Pengantaran & setup di lokasi termasuk tugasmu?"
      : input.category === "konveksi"
        ? "Pengiriman ke alamat klien termasuk tugasmu?"
        : input.category === "jasa"
          ? "Kunjungan & transport ke lokasi klien termasuk tugasmu?"
          : "Pemasangan/pengantaran di lokasi termasuk tugasmu?";

  return [
    {
      id: "install",
      text: installText,
      options: ["Ya, tim saya", "Dikerjakan klien", "Pakai vendor"],
    },
    {
      id: "approval",
      text: "Berapa lama klien biasanya memberi persetujuan?",
      options: ["1 hari", "2–3 hari", "Seminggu"],
    },
    {
      id: "material",
      text:
        input.category === "katering"
          ? "Bahan baku sudah tersedia?"
          : "Bahan baku & material sudah tersedia?",
      options: ["Sudah siap", "Sebagian", "Belum, perlu beli"],
    },
  ];
}

function approvalDays(answers: Record<string, string>): number {
  const value = answers.approval ?? "";
  if (/minggu|week/i.test(value)) return 5;
  if (/2|3/.test(value)) return 3;
  return 1;
}

function assigneePicker(team: string[]) {
  const pool = team.map((name) => name.trim()).filter(Boolean);
  const names = pool.length ? pool : ["Saya"];
  let counter = 0;
  return (type: TaskType) => {
    if (type === "payment" || type === "waiting_client") return names[0];
    if (type === "vendor" || type === "delivery") return names[names.length - 1];
    const name = names[counter % names.length];
    counter += 1;
    return name;
  };
}

class PlanBuilder {
  phases: { id: string; name: string }[] = [];
  tasks: AiTask[] = [];
  private taskCounter = 0;
  private phaseCounter = 0;
  private pick: (type: TaskType) => string;

  constructor(
    team: string[],
    private lang: Lang = "id",
  ) {
    this.pick = assigneePicker(team);
  }

  phase(name: string): string {
    this.phaseCounter += 1;
    const id = `p${this.phaseCounter}`;
    this.phases.push({ id, name: translate(this.lang, name) });
    return id;
  }

  add(phase: string, title: string, days: number, type: TaskType, deps: string[] = []): string {
    this.taskCounter += 1;
    const id = `t${this.taskCounter}`;
    this.tasks.push({
      id,
      phase,
      title: translate(this.lang, title),
      duration_days: Math.max(1, Math.round(days)),
      depends_on: deps.filter(Boolean),
      type,
      assignee: this.pick(type),
    });
    return id;
  }
}

function craftPlan(input: PlanInput, answers: Record<string, string>, lang: Lang = "id"): { tasks: AiTask[]; phases: { id: string; name: string }[]; risks: string[] } {
  const b = new PlanBuilder(input.team, lang);
  const approval = approvalDays(answers);
  const install = answers.install ?? "";
  const materials = answers.material ?? "";
  const story = input.story.toLowerCase();
  const hasPlakat = /plakat|nama|label|tulisan/.test(story);
  const isFiber = /fiber|patung|relief|arca|kuda/.test(story);

  const p1 = b.phase("Persiapan & desain");
  const p2 = b.phase("Produksi");
  const p3 = b.phase("Finishing");
  const p4 = b.phase("Kirim & serah terima");

  const brief = b.add(p1, "Konfirmasi brief & ukuran", 1, "waiting_client");
  const sketch = b.add(p1, isFiber ? "Sketsa 3 tampak" : "Sketsa & desain awal", 3, "internal", [brief]);
  const revision = b.add(p1, "Revisi sketsa klien", approval, "waiting_client", [sketch]);
  const approvalTask = b.add(p1, "Persetujuan sketsa + DP 50%", 1, "payment", [revision]);

  const materialTitle = /belum|not yet/i.test(materials)
    ? "Belanja bahan & alat"
    : /sebagian/i.test(materials)
      ? "Lengkapi bahan yang kurang"
      : "Cek bahan di workshop";
  const material = b.add(p2, materialTitle, 1, "internal", [approvalTask]);
  const frame = b.add(p2, "Buat rangka & struktur dasar", 2, "internal", [material]);
  const model = b.add(p2, isFiber ? "Model tanah liat / cetakan" : "Bentuk & cetak dasar", 3, "internal", [frame]);
  const cast = b.add(p2, isFiber ? "Cetak fiberglass" : "Produksi utama", 4, "internal", [model]);
  const vendor = b.add(
    p2,
    hasPlakat ? "Pesan plakat nama ke vendor" : "Pesan komponen pendukung",
    2,
    "vendor",
    [approvalTask],
  );
  const sanding = b.add(p2, "Dempul & amplas", 3, "internal", [cast]);
  const textConfirm = b.add(
    p2,
    hasPlakat ? "Konfirmasi teks plakat nama" : "Konfirmasi detail komponen",
    1,
    "waiting_client",
    [vendor],
  );

  const paint = b.add(p3, isFiber ? "Finishing cat & detail" : "Finishing akhir", 5, "internal", [sanding, textConfirm]);
  const attach = b.add(p3, "Pasang aksesori & komponen", 1, "internal", [paint, textConfirm]);
  const qc = b.add(p3, "QC akhir & foto produk", 1, "internal", [attach]);

  const packing = b.add(p4, "Packing kayu", 3, "delivery", [qc]);
  const schedule = b.add(p4, "Konfirmasi jadwal pengiriman", 1, "waiting_client", [qc]);
  let handover: string;
  if (/klien|client/i.test(install)) {
    handover = b.add(p4, "Koordinasi pengiriman dengan klien", 1, "waiting_client", [packing, schedule]);
  } else if (/vendor/i.test(install)) {
    handover = b.add(p4, "Sewa vendor pengiriman & pemasangan", 2, "vendor", [packing, schedule]);
  } else {
    handover = b.add(p4, "Pengiriman & pemasangan", 2, "delivery", [packing, schedule]);
  }
  b.add(p4, "Pelunasan 50%", 1, "payment", [handover]);

  const risks = [
    "Persetujuan sketsa klien menahan seluruh produksi.",
    "Minggu dan hari libur tidak dihitung, jadi jadwal bisa terasa lebih pendek.",
    isFiber
      ? "Pengeringan fiberglass butuh cuaca kering; hujan bisa memperlambat finishing."
      : "Ketersediaan bahan di supplier bisa menggeser tanggal produksi.",
  ];

  return { tasks: b.tasks, phases: b.phases, risks };
}

function cateringPlan(input: PlanInput, answers: Record<string, string>, lang: Lang = "id"): { tasks: AiTask[]; phases: { id: string; name: string }[]; risks: string[] } {
  const b = new PlanBuilder(input.team, lang);
  const approval = approvalDays(answers);
  const install = answers.install ?? "";
  const materials = answers.material ?? "";

  const p1 = b.phase("Persiapan menu");
  const p2 = b.phase("Belanja");
  const p3 = b.phase("Produksi");
  const p4 = b.phase("Pengiriman & acara");

  const menu = b.add(p1, "Konfirmasi menu & jumlah porsi", 1, "waiting_client");
  const count = b.add(p1, "Hitung porsi & kebutuhan bahan", 1, "internal", [menu]);
  const approve = b.add(p1, "Persetujuan menu + DP 50%", approval, "payment", [count]);

  const dry = b.add(
    p2,
    /belum|not yet/i.test(materials)
      ? "Belanja bahan kering & bumbu"
      : "Cek stok bahan kering & bumbu",
    1,
    "internal",
    [approve],
  );
  const fresh = b.add(p2, "Belanja sayur & bumbu segar", 1, "internal", [dry]);
  const protein = b.add(p2, "Ambil pesanan protein / ayam", 1, "vendor", [approve]);
  const packaging = b.add(p2, "Cek stok kemasan & perlengkapan", 1, "internal", [approve]);

  const marinate = b.add(p3, "Persiapan bumbu & marinasi", 1, "internal", [fresh, protein]);
  const cook = b.add(p3, "Masak sesuai jumlah porsi", 1, "internal", [marinate]);
  const pack = b.add(p3, "Packing & labeling", 1, "internal", [cook, packaging]);

  const depart = b.add(p4, "Muat & berangkat ke lokasi", 1, "delivery", [pack]);
  let handover: string;
  if (/klien|client/i.test(install)) {
    handover = b.add(p4, "Koordinasi serah terima dengan klien", 1, "waiting_client", [depart]);
  } else if (/vendor/i.test(install)) {
    handover = b.add(p4, "Sewa vendor pengiriman & setup", 2, "vendor", [depart]);
  } else {
    handover = b.add(p4, "Setup & serah terima di lokasi", 1, "delivery", [depart]);
  }
  b.add(p4, "Pelunasan 50%", 1, "payment", [handover]);

  return {
    tasks: b.tasks,
    phases: b.phases,
    risks: [
      "Bahan segar harus dibeli mendekati hari acara agar tidak rusak.",
      "Keterlambatan konfirmasi jumlah porsi membuat belanja dan masak bergeser.",
      "Lalu lintas saat pengantaran bisa memakan waktu; siapkan cadangan 30 menit.",
    ],
  };
}

function garmentPlan(input: PlanInput, answers: Record<string, string>, lang: Lang = "id"): { tasks: AiTask[]; phases: { id: string; name: string }[]; risks: string[] } {
  const b = new PlanBuilder(input.team, lang);
  const approval = approvalDays(answers);

  const p1 = b.phase("Desain & sampel");
  const p2 = b.phase("Bahan & produksi");
  const p3 = b.phase("Finishing");
  const p4 = b.phase("Pengiriman");

  const brief = b.add(p1, "Brief, ukuran & jumlah", 1, "waiting_client");
  const design = b.add(p1, "Desain & mockup", 2, "internal", [brief]);
  const sample = b.add(p1, "Buat sampel", 2, "internal", [design]);
  const approve = b.add(p1, "Persetujuan sampel & DP 50%", approval, "waiting_client", [sample]);
  b.add(p1, "Terima DP 50%", 1, "payment", [approve]);

  const fabric = b.add(p2, "Belanja kain & aksesori", 1, "internal", [approve]);
  const cut = b.add(p2, "Potong pola", 2, "internal", [fabric]);
  const sew = b.add(p2, "Jahit produksi", 4, "internal", [cut]);
  const print = b.add(p2, "Sablon / bordir", 2, "vendor", [cut]);

  const finish = b.add(p3, "Finishing & QC", 2, "internal", [sew, print]);
  const pack = b.add(p3, "Setrika & packing", 1, "internal", [finish]);

  const confirm = b.add(p4, "Konfirmasi jadwal pengiriman", 1, "waiting_client", [pack]);
  const deliver = b.add(p4, "Pengiriman ke klien", 1, "delivery", [confirm]);
  b.add(p4, "Pelunasan 50%", 1, "payment", [deliver]);

  return {
    tasks: b.tasks,
    phases: b.phases,
    risks: [
      "Sampel yang belum disetujui menahan seluruh produksi.",
      "Kain dari supplier bisa berbeda warna antar-roll; cek sebelum memotong.",
      "Revisi setelah produksi berjalan memakan bahan dan waktu.",
    ],
  };
}

function servicePlan(input: PlanInput, answers: Record<string, string>, lang: Lang = "id"): { tasks: AiTask[]; phases: { id: string; name: string }[]; risks: string[] } {
  const b = new PlanBuilder(input.team, lang);
  const approval = approvalDays(answers);

  const p1 = b.phase("Brief & penawaran");
  const p2 = b.phase("Persiapan");
  const p3 = b.phase("Eksekusi");
  const p4 = b.phase("Serah terima");

  const brief = b.add(p1, "Meeting brief dengan klien", 1, "waiting_client");
  const proposal = b.add(p1, "Susun proposal & RAB", 1, "internal", [brief]);
  const approve = b.add(p1, "Persetujuan lingkup & DP 50%", approval, "payment", [proposal]);

  const material = b.add(p2, "Kumpulkan materi & referensi", 2, "internal", [approve]);
  const vendor = b.add(p2, "Konfirmasi tim / vendor pendukung", 1, "vendor", [approve]);
  const check = b.add(p2, "Cek kebutuhan & gladi", 1, "internal", [material, vendor]);

  const execute = b.add(p3, "Eksekusi pekerjaan", 4, "internal", [check]);
  const revision = b.add(p3, "Revisi dari klien", approval, "waiting_client", [execute]);
  const qc = b.add(p3, "QC & finalisasi", 1, "internal", [revision]);

  const handover = b.add(p4, "Serah terima hasil", 1, "delivery", [qc]);
  b.add(p4, "Pelunasan 50%", 1, "payment", [handover]);

  return {
    tasks: b.tasks,
    phases: b.phases,
    risks: [
      "Perubahan lingkup setelah penawaran disetujui bisa menambah waktu.",
      "Menunggu materi dari klien adalah penyebab jadwal paling sering bergeser.",
      "Sisakan waktu untuk satu putaran revisi sebelum serah terima.",
    ],
  };
}

function genericPlan(input: PlanInput, answers: Record<string, string>, lang: Lang = "id"): { tasks: AiTask[]; phases: { id: string; name: string }[]; risks: string[] } {
  const b = new PlanBuilder(input.team, lang);
  const approval = approvalDays(answers);

  const p1 = b.phase("Persiapan");
  const p2 = b.phase("Pelaksanaan");
  const p3 = b.phase("Finishing");
  const p4 = b.phase("Serah terima");

  const brief = b.add(p1, "Konfirmasi kebutuhan klien", 1, "waiting_client");
  const plan = b.add(p1, "Susun rencana kerja", 1, "internal", [brief]);
  const approve = b.add(p1, "Persetujuan rencana & DP 50%", approval, "payment", [plan]);
  const supply = b.add(p2, "Siapkan bahan & perlengkapan", 2, "internal", [approve]);
  const vendor = b.add(p2, "Konfirmasi vendor pendukung", 1, "vendor", [approve]);
  const execute = b.add(p2, "Kerjakan pesanan", 4, "internal", [supply, vendor]);
  const revision = b.add(p2, "Revisi sesuai masukan klien", approval, "waiting_client", [execute]);
  const qc = b.add(p3, "Pengecekan akhir", 1, "internal", [revision]);
  const pack = b.add(p3, "Kemas & siapkan pengiriman", 1, "delivery", [qc]);
  const deliver = b.add(p4, "Kirim ke klien", 1, "delivery", [pack]);
  const handover = b.add(p4, "Serah terima", 1, "delivery", [deliver]);
  b.add(p4, "Pelunasan 50%", 1, "payment", [handover]);

  return {
    tasks: b.tasks,
    phases: b.phases,
    risks: [
      "Pastikan lingkup pekerjaan tertulis agar revisi tidak melebar.",
      "Minggu dan hari libur tidak dihitung dalam jadwal.",
      "Simpan cadangan waktu untuk menunggu persetujuan klien.",
    ],
  };
}

export function generateMockPlan(
  input: PlanInput,
  answers: Record<string, string>,
  lang: Lang = "id",
): AiPlan {
  const builder =
    input.category === "katering"
      ? cateringPlan
      : input.category === "konveksi"
        ? garmentPlan
        : input.category === "jasa"
          ? servicePlan
          : input.category === "lainnya"
            ? genericPlan
            : craftPlan;
  const plan = builder(input, answers, lang);
  return {
    questions: [],
    phases: plan.phases,
    tasks: plan.tasks,
    risks: plan.risks.map((risk) => translate(lang, risk)),
  };
}

const SYSTEM_PROMPT = `Kamu membantu UMKM Indonesia memecah proyek klien menjadi tugas kanban.

Balas HANYA JSON valid dengan skema:
{
  "questions": [{"id":"q1","text":"...","options":["..."]}],
  "phases": [{"id":"p1","name":"Persiapan & desain"}],
  "tasks": [{
    "id":"t1","phase":"p1","title":"Sketsa 3 tampak",
    "duration_days":3,"depends_on":[],
    "type":"internal","assignee":"Made"
  }],
  "risks": ["..."]
}

Aturan:
- Jangan menulis tanggal. Tulis duration_days (hari kerja) saja.
- Bahasa Indonesia yang ringkas, judul tugas maksimal 60 karakter.
- Selalu sertakan tugas yang sering terlupa jika relevan: menunggu persetujuan klien, DP/pelunasan, pesan ke vendor, pengiriman/pemasangan.
- Tipe tugas hanya: internal | waiting_client | vendor | payment | delivery.
- depends_on berisi id tugas lain yang harus selesai lebih dulu. Jangan membuat siklus.
- Maksimal 40 tugas. Jangan mengarang harga.
- Jika informasi penting kurang, isi questions (maks 3) dan kosongkan tasks.
- phases dan tasks harus konsisten; setiap task.phase harus ada di phases.
- assignee dipilih dari daftar tim yang diberikan.`;

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI tidak mengembalikan JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizePlan(raw: unknown, input: PlanInput): AiPlan {
  const data = raw as Partial<AiPlan>;
  if (!data || !Array.isArray(data.phases) || !Array.isArray(data.tasks)) {
    throw new Error("Struktur JSON dari AI tidak sesuai skema.");
  }
  const phases = data.phases
    .filter((phase) => phase && typeof phase.id === "string" && typeof phase.name === "string")
    .slice(0, 8)
    .map((phase) => ({ id: phase.id, name: phase.name.slice(0, 80) }));
  if (!phases.length) throw new Error("AI tidak mengembalikan fase.");

  const phaseIds = new Set(phases.map((phase) => phase.id));
  const phaseByName = new Map(phases.map((phase) => [phase.name.toLowerCase(), phase.id]));
  const taskIds = new Set<string>();

  const tasks: AiTask[] = [];
  for (const item of data.tasks.slice(0, 40)) {
    if (!item || typeof item.title !== "string") continue;
    const phase =
      phaseIds.has(item.phase) ? item.phase : phaseByName.get(String(item.phase ?? "").toLowerCase());
    if (!phase) continue;
    const type = TYPES.includes(item.type) ? item.type : "internal";
    const days = Math.min(30, Math.max(1, Math.round(Number(item.duration_days) || 1)));
    const id =
      typeof item.id === "string" && !taskIds.has(item.id)
        ? item.id
        : `t${tasks.length + 1}_${Math.random().toString(36).slice(2, 6)}`;
    taskIds.add(id);
    tasks.push({
      id,
      phase,
      title: item.title.trim().slice(0, 100),
      duration_days: days,
      depends_on: Array.isArray(item.depends_on)
        ? item.depends_on.filter((dep) => typeof dep === "string")
        : [],
      type,
      assignee:
        typeof item.assignee === "string" && item.assignee.trim()
          ? item.assignee.trim().slice(0, 40)
          : input.team[0] || "Saya",
    });
  }

  if (!tasks.length) throw new Error("AI tidak mengembalikan tugas yang bisa dipakai.");

  const validIds = new Set(tasks.map((task) => task.id));
  for (const task of tasks) {
    task.depends_on = task.depends_on.filter((dep) => validIds.has(dep) && dep !== task.id);
  }

  return {
    questions: [],
    phases,
    tasks,
    risks: Array.isArray(data.risks)
      ? data.risks.filter((risk): risk is string => typeof risk === "string").slice(0, 4)
      : [],
  };
}

export async function generateLlmPlan(
  input: PlanInput,
  answers: Record<string, string>,
  lang: Lang = "id",
): Promise<AiPlan | null> {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const userPrompt = `Data proyek:
- Jenis usaha: ${input.category}
- Nama proyek: ${input.title}
- Klien: ${input.clientName}
- Deadline: ${input.deadline}
- Tim: ${input.team.join(", ") || "belum diisi"}
- Hari kerja: ${input.workdays.join(",") || "Senin-Sabtu"}
- Nilai proyek: ${input.value ? `Rp ${input.value}` : "tidak disebutkan"}
- Cerita proyek: ${input.story}

Jawaban pertanyaan klarifikasi:
${Object.entries(answers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n") || "- tidak ada"}

Buat rencana tugasnya sekarang.`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                lang === "en"
                  ? `${SYSTEM_PROMPT}\n\nIMPORTANT: Write every task title, phase name, question, option, and risk in concise English. Keep all JSON keys unchanged.`
                  : SYSTEM_PROMPT,
            },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(
          translate(lang, "Layanan AI membalas {status}.", { status: response.status }),
        );
      }
      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("Layanan AI mengembalikan jawaban kosong.");
      return normalizePlan(extractJson(content), input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Gagal memanggil AI.");
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error("Gagal menyusun rencana dengan AI.");
}
