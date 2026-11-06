import { createPasswordHash } from "./password";
import { addDays, todayISO, weekdayIndex } from "./dates";
import type { Category, Database, Holiday, Phase, Project, Task, TaskStatus, TaskType } from "./types";

const NOW = new Date().toISOString();

const DEMO_USER_ID = "u_demo_made";

function dateSafe(value: string): string {
  let cursor = value;
  // Jangan pernah membuat tugas di hari Minggu. Tanggal libur lain diatur manual pada seed.
  if (weekdayIndex(cursor) === 0) cursor = addDays(cursor, 1);
  return cursor;
}

interface TaskSeed {
  id: string;
  phase: string;
  title: string;
  type: TaskType;
  start: string;
  due: string;
  days: number;
  status: TaskStatus;
  assignee: string;
  dependsOn?: string[];
  progressNote?: string;
}

function makeTask(
  projectId: string,
  phaseId: string,
  seed: TaskSeed,
  order: number,
): Task {
  return {
    id: seed.id,
    projectId,
    phaseId,
    title: seed.title,
    type: seed.type,
    startDate: dateSafe(seed.start),
    dueDate: dateSafe(seed.due),
    durationDays: seed.days,
    dependsOn: seed.dependsOn ?? [],
    assignee: seed.assignee,
    status: seed.status,
    source: "ai",
    order,
    completedAt: seed.status === "done" ? dateSafe(seed.due) : null,
    progressNote: seed.progressNote,
  };
}

function makeProject(
  project: Omit<Project, "attachments" | "createdAt" | "updatedAt" | "bufferDays"> & {
    bufferDays?: number;
    createdAt: string;
    updatedAt: string;
  },
): Project {
  return {
    ...project,
    bufferDays: project.bufferDays ?? 2,
    attachments: [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function createSeedDatabase(): Database {
  const { salt, hash } = createPasswordHash("demo123");

  const projects: Project[] = [
    makeProject({
      id: "p_patung",
      userId: DEMO_USER_ID,
      title: "Patung kuda – Kantor Dinas Provinsi",
      category: "kerajinan",
      clientName: "Bu Ayu",
      clientWa: "081234567890",
      deadline: "2026-12-07",
      bufferDays: 2,
      story:
        "Patung kuda dari fiberglass, tinggi kira-kira 2 meter, posisi kuda berdiri dengan dua kaki depan diangkat. Finishing warna perunggu, ada plakat nama di bagian bawah. Dipasang di lobby kantor dinas, harus sudah berdiri sebelum acara peresmian. Klien mau lihat sketsa dulu sebelum produksi. DP 50% setelah sketsa disetujui. Tim saya 3 orang, kerja Senin–Sabtu.",
      value: 45_000_000,
      team: ["Made", "Wayan", "Komang"],
      workdays: [1, 2, 3, 4, 5, 6],
      createdAt: "2026-10-20T01:00:00.000Z",
      updatedAt: "2026-11-06T08:00:00.000Z",
    }),
    makeProject({
      id: "p_katering",
      userId: DEMO_USER_ID,
      title: "Nasi kotak 150 porsi – Rapat Kantor Camat",
      category: "katering",
      clientName: "Bu Sari",
      clientWa: "081246801357",
      deadline: "2026-11-19",
      deadlineTime: "11:00",
      bufferDays: 1,
      story:
        "Nasi kotak 150 porsi untuk rapat kantor camat. Menu: nasi putih, ayam betutu, lawar, telur, sambal matah, dan buah. Acara Kamis 19 November, makanan tiba di lokasi jam 11.00. Butuh 3 orang tim. Klien sudah bayar DP 50%, sisanya setelah acara.",
      value: 7_500_000,
      team: ["Made", "Kadek", "Putu", "Komang"],
      workdays: [1, 2, 3, 4, 5, 6],
      createdAt: "2026-11-02T02:00:00.000Z",
      updatedAt: "2026-11-05T09:00:00.000Z",
    }),
    makeProject({
      id: "p_relief",
      userId: DEMO_USER_ID,
      title: "Relief garuda – Hotel Ubud",
      category: "kerajinan",
      clientName: "Hotel Ubud",
      clientWa: "081337654321",
      deadline: "2026-12-15",
      bufferDays: 2,
      story:
        "Relief garuda untuk dinding lobby hotel, ukuran 180 x 90 cm, bahan fiberglass dengan finishing gold antique. Dipasang di dinding batu alam, perlu koordinasi dengan tim hotel untuk titik lampu. Deadline 15 Desember, acara pembukaan 18 Desember.",
      value: 18_000_000,
      team: ["Made", "Wayan", "Komang"],
      workdays: [1, 2, 3, 4, 5, 6],
      createdAt: "2026-11-01T03:00:00.000Z",
      updatedAt: "2026-11-05T04:00:00.000Z",
    }),
    makeProject({
      id: "p_ukiran",
      userId: DEMO_USER_ID,
      title: "Ukiran pintu – Villa Canggu",
      category: "kerajinan",
      clientName: "Villa Canggu",
      clientWa: "081999887766",
      deadline: "2027-01-09",
      bufferDays: 2,
      story:
        "Ukiran pintu utama villa dari kayu suar, motif flora Bali. Ukuran pintu 120 x 240 cm, sudah termasuk kusen. Klien minta finishing natural matte. Pengiriman ke Canggu, dipasang oleh tukang klien.",
      value: 9_500_000,
      team: ["Made", "Wayan", "Komang"],
      workdays: [1, 2, 3, 4, 5, 6],
      createdAt: "2026-11-03T05:00:00.000Z",
      updatedAt: "2026-11-04T06:00:00.000Z",
    }),
  ];

  const phases: Phase[] = [
    { id: "ph_patung_1", projectId: "p_patung", name: "Persiapan & desain", order: 1 },
    { id: "ph_patung_2", projectId: "p_patung", name: "Produksi", order: 2 },
    { id: "ph_patung_3", projectId: "p_patung", name: "Finishing", order: 3 },
    { id: "ph_patung_4", projectId: "p_patung", name: "Kirim & serah terima", order: 4 },
    { id: "ph_katering_1", projectId: "p_katering", name: "Persiapan menu", order: 1 },
    { id: "ph_katering_2", projectId: "p_katering", name: "Belanja", order: 2 },
    { id: "ph_katering_3", projectId: "p_katering", name: "Produksi", order: 3 },
    { id: "ph_katering_4", projectId: "p_katering", name: "Pengiriman & acara", order: 4 },
    { id: "ph_relief_1", projectId: "p_relief", name: "Persiapan & desain", order: 1 },
    { id: "ph_relief_2", projectId: "p_relief", name: "Produksi", order: 2 },
    { id: "ph_relief_3", projectId: "p_relief", name: "Finishing", order: 3 },
    { id: "ph_relief_4", projectId: "p_relief", name: "Kirim & pemasangan", order: 4 },
    { id: "ph_ukiran_1", projectId: "p_ukiran", name: "Desain & bahan", order: 1 },
    { id: "ph_ukiran_2", projectId: "p_ukiran", name: "Produksi", order: 2 },
    { id: "ph_ukiran_3", projectId: "p_ukiran", name: "Finishing & kirim", order: 3 },
  ];

  const patungSeeds: TaskSeed[] = [
    { id: "t_patung_1", phase: "ph_patung_1", title: "Konfirmasi brief & ukuran", type: "waiting_client", start: "2026-10-26", due: "2026-10-27", days: 1, status: "done", assignee: "Made" },
    { id: "t_patung_2", phase: "ph_patung_1", title: "Sketsa 3 tampak", type: "internal", start: "2026-10-28", due: "2026-10-30", days: 3, status: "done", assignee: "Made", dependsOn: ["t_patung_1"] },
    { id: "t_patung_3", phase: "ph_patung_1", title: "Revisi sketsa klien", type: "waiting_client", start: "2026-10-31", due: "2026-11-02", days: 2, status: "done", assignee: "Made", dependsOn: ["t_patung_2"] },
    { id: "t_patung_4", phase: "ph_patung_1", title: "Persetujuan sketsa + DP 50%", type: "payment", start: "2026-11-03", due: "2026-11-03", days: 1, status: "done", assignee: "Made", dependsOn: ["t_patung_3"] },
    { id: "t_patung_5", phase: "ph_patung_2", title: "Belanja resin, serat fiber & besi", type: "internal", start: "2026-11-02", due: "2026-11-02", days: 1, status: "done", assignee: "Wayan", dependsOn: ["t_patung_4"] },
    { id: "t_patung_6", phase: "ph_patung_2", title: "Buat rangka besi", type: "internal", start: "2026-11-03", due: "2026-11-04", days: 2, status: "done", assignee: "Wayan", dependsOn: ["t_patung_5"] },
    { id: "t_patung_7", phase: "ph_patung_2", title: "Cetak fiberglass", type: "internal", start: "2026-11-05", due: "2026-11-09", days: 4, status: "doing", assignee: "Wayan", dependsOn: ["t_patung_6"], progressNote: "Cetakan kedua sedang dikeringkan; estimasi selesai 9 Nov." },
    { id: "t_patung_8", phase: "ph_patung_2", title: "Konfirmasi teks plakat nama", type: "waiting_client", start: "2026-11-05", due: "2026-11-05", days: 1, status: "waiting", assignee: "Made", dependsOn: ["t_patung_4"], progressNote: "Menunggu balasan Bu Ayu untuk teks plakat sejak 5 Nov." },
    { id: "t_patung_9", phase: "ph_patung_2", title: "Pesan plakat ke vendor", type: "vendor", start: "2026-11-10", due: "2026-11-11", days: 2, status: "todo", assignee: "Komang", dependsOn: ["t_patung_8"], progressNote: "Plakat sedang dalam pengantaran dengan estimasi penyampaian tgl 10 Nov pukul 16:45." },
    { id: "t_patung_10", phase: "ph_patung_2", title: "Dempul & amplas", type: "internal", start: "2026-11-12", due: "2026-11-14", days: 3, status: "todo", assignee: "Wayan", dependsOn: ["t_patung_7"], progressNote: "Belum mulai — menunggu cetakan fiberglass kering." },
    { id: "t_patung_11", phase: "ph_patung_2", title: "Finishing cat & detail kuda", type: "internal", start: "2026-11-16", due: "2026-11-20", days: 5, status: "todo", assignee: "Made", dependsOn: ["t_patung_10", "t_patung_9"] },
    { id: "t_patung_12", phase: "ph_patung_3", title: "Pasang plakat & aksesori", type: "internal", start: "2026-11-23", due: "2026-11-23", days: 1, status: "todo", assignee: "Komang", dependsOn: ["t_patung_11", "t_patung_9"] },
    { id: "t_patung_13", phase: "ph_patung_3", title: "QC akhir & foto produk", type: "internal", start: "2026-11-24", due: "2026-11-24", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_patung_12"] },
    { id: "t_patung_14", phase: "ph_patung_3", title: "Packing kayu", type: "delivery", start: "2026-11-26", due: "2026-11-28", days: 3, status: "todo", assignee: "Komang", dependsOn: ["t_patung_13"] },
    { id: "t_patung_15", phase: "ph_patung_4", title: "Konfirmasi jadwal pengiriman", type: "waiting_client", start: "2026-11-30", due: "2026-11-30", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_patung_13"] },
    { id: "t_patung_16", phase: "ph_patung_4", title: "Sewa pickup & angkut", type: "vendor", start: "2026-12-01", due: "2026-12-01", days: 1, status: "todo", assignee: "Komang", dependsOn: ["t_patung_14"] },
    { id: "t_patung_17", phase: "ph_patung_4", title: "Pengiriman & pemasangan", type: "delivery", start: "2026-12-02", due: "2026-12-03", days: 2, status: "todo", assignee: "Wayan", dependsOn: ["t_patung_16", "t_patung_15"] },
    { id: "t_patung_18", phase: "ph_patung_4", title: "Pelunasan 50%", type: "payment", start: "2026-12-03", due: "2026-12-03", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_patung_17"] },
  ];

  const reliefSeeds: TaskSeed[] = [
    { id: "t_relief_1", phase: "ph_relief_1", title: "Konfirmasi brief & ukuran", type: "waiting_client", start: "2026-11-09", due: "2026-11-09", days: 1, status: "done", assignee: "Made" },
    { id: "t_relief_2", phase: "ph_relief_1", title: "Desain relief garuda", type: "internal", start: "2026-11-10", due: "2026-11-12", days: 3, status: "done", assignee: "Made", dependsOn: ["t_relief_1"] },
    { id: "t_relief_3", phase: "ph_relief_1", title: "Persetujuan desain klien", type: "waiting_client", start: "2026-11-13", due: "2026-11-13", days: 1, status: "done", assignee: "Made", dependsOn: ["t_relief_2"] },
    { id: "t_relief_4", phase: "ph_relief_2", title: "Belanja resin & serat fiber", type: "internal", start: "2026-11-16", due: "2026-11-16", days: 1, status: "done", assignee: "Wayan", dependsOn: ["t_relief_3"] },
    { id: "t_relief_5", phase: "ph_relief_2", title: "Cetak & bentuk relief", type: "internal", start: "2026-11-17", due: "2026-11-21", days: 5, status: "doing", assignee: "Wayan", dependsOn: ["t_relief_4"], progressNote: "Relief sudah dicetak, sekarang masuk tahap pengeringan." },
    { id: "t_relief_6", phase: "ph_relief_3", title: "Finishing gold antique", type: "internal", start: "2026-11-23", due: "2026-11-27", days: 5, status: "todo", assignee: "Komang", dependsOn: ["t_relief_5"], progressNote: "Menunggu relief kering sebelum finishing gold." },
    { id: "t_relief_7", phase: "ph_relief_3", title: "QC & foto produk", type: "internal", start: "2026-11-30", due: "2026-11-30", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_relief_6"] },
    { id: "t_relief_8", phase: "ph_relief_4", title: "Pengiriman & pemasangan", type: "delivery", start: "2026-12-02", due: "2026-12-03", days: 2, status: "todo", assignee: "Wayan", dependsOn: ["t_relief_7"] },
    { id: "t_relief_9", phase: "ph_relief_4", title: "Pelunasan 50%", type: "payment", start: "2026-12-03", due: "2026-12-03", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_relief_8"] },
  ];

  const ukiranSeeds: TaskSeed[] = [
    { id: "t_ukiran_1", phase: "ph_ukiran_1", title: "Brief & ukuran pintu", type: "waiting_client", start: "2026-12-01", due: "2026-12-01", days: 1, status: "done", assignee: "Made" },
    { id: "t_ukiran_2", phase: "ph_ukiran_1", title: "Desain motif flora Bali", type: "internal", start: "2026-12-02", due: "2026-12-04", days: 3, status: "doing", assignee: "Made", dependsOn: ["t_ukiran_1"], progressNote: "Sketsa motif sudah 60%; revisi internal dijadwalkan 4 Des." },
    { id: "t_ukiran_3", phase: "ph_ukiran_1", title: "Beli kayu suar", type: "internal", start: "2026-12-05", due: "2026-12-05", days: 1, status: "todo", assignee: "Wayan", dependsOn: ["t_ukiran_1"] },
    { id: "t_ukiran_4", phase: "ph_ukiran_2", title: "Ukir & bentuk pintu", type: "internal", start: "2026-12-07", due: "2026-12-12", days: 6, status: "todo", assignee: "Wayan", dependsOn: ["t_ukiran_2", "t_ukiran_3"] },
    { id: "t_ukiran_5", phase: "ph_ukiran_3", title: "Finishing natural matte", type: "internal", start: "2026-12-14", due: "2026-12-18", days: 5, status: "todo", assignee: "Komang", dependsOn: ["t_ukiran_4"] },
    { id: "t_ukiran_6", phase: "ph_ukiran_3", title: "Pengiriman ke Canggu", type: "delivery", start: "2026-12-21", due: "2026-12-21", days: 1, status: "todo", assignee: "Komang", dependsOn: ["t_ukiran_5"] },
    { id: "t_ukiran_7", phase: "ph_ukiran_3", title: "Pelunasan", type: "payment", start: "2026-12-21", due: "2026-12-21", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_ukiran_6"] },
  ];

  const today = todayISO();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const twoDaysAgo = addDays(today, -2);
  const threeDaysAgo = addDays(today, -3);

  const kateringSeeds: TaskSeed[] = [
    { id: "t_kat_1", phase: "ph_katering_1", title: "Konfirmasi menu & jumlah porsi", type: "waiting_client", start: today, due: today, days: 1, status: "done", assignee: "Made" },
    { id: "t_kat_2", phase: "ph_katering_1", title: "Hitung porsi & kebutuhan bahan", type: "internal", start: today, due: today, days: 1, status: "done", assignee: "Made", dependsOn: ["t_kat_1"] },
    { id: "t_kat_3", phase: "ph_katering_1", title: "Persetujuan menu & DP 50%", type: "payment", start: twoDaysAgo, due: twoDaysAgo, days: 1, status: "done", assignee: "Made" },
    { id: "t_kat_4", phase: "ph_katering_2", title: "Belanja bahan kering & bumbu", type: "internal", start: threeDaysAgo, due: threeDaysAgo, days: 1, status: "done", assignee: "Putu" },
    { id: "t_kat_5", phase: "ph_katering_2", title: "Belanja sayur & bumbu di pasar", type: "internal", start: today, due: today, days: 1, status: "todo", assignee: "Putu", dependsOn: ["t_kat_4"], progressNote: "Belanja pasar dijadwalkan pagi ini." },
    { id: "t_kat_6", phase: "ph_katering_2", title: "Ambil pesanan ayam 20 kg", type: "vendor", start: yesterday, due: yesterday, days: 1, status: "todo", assignee: "Kadek", dependsOn: ["t_kat_3"], progressNote: "Pesanan ayam sudah dikonfirmasi vendor; menunggu pickup." },
    { id: "t_kat_7", phase: "ph_katering_2", title: "Cek stok kotak, sendok & tisu", type: "internal", start: today, due: today, days: 1, status: "todo", assignee: "Komang" },
    { id: "t_kat_8", phase: "ph_katering_2", title: "Persiapan bumbu & marinasi", type: "internal", start: tomorrow, due: tomorrow, days: 1, status: "todo", assignee: "Kadek", dependsOn: ["t_kat_6"], progressNote: "Bumbu sudah disiapkan; marinasi besok pagi." },
    { id: "t_kat_9", phase: "ph_katering_3", title: "Masak 150 porsi", type: "internal", start: "2026-11-18", due: "2026-11-18", days: 1, status: "todo", assignee: "Kadek", dependsOn: ["t_kat_8"] },
    { id: "t_kat_10", phase: "ph_katering_3", title: "Packing 150 kotak", type: "internal", start: "2026-11-18", due: "2026-11-18", days: 1, status: "todo", assignee: "Putu", dependsOn: ["t_kat_9"] },
    { id: "t_kat_11", phase: "ph_katering_4", title: "Muat & berangkat ke lokasi", type: "delivery", start: "2026-11-19", due: "2026-11-19", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_kat_10"] },
    { id: "t_kat_12", phase: "ph_katering_4", title: "Setup & serah terima", type: "delivery", start: "2026-11-19", due: "2026-11-19", days: 1, status: "todo", assignee: "Komang", dependsOn: ["t_kat_11"] },
    { id: "t_kat_13", phase: "ph_katering_4", title: "Pelunasan 50%", type: "payment", start: "2026-11-19", due: "2026-11-19", days: 1, status: "todo", assignee: "Made", dependsOn: ["t_kat_11"] },
  ];

  const tasks: Task[] = [
    ...patungSeeds.map((seed, index) => makeTask("p_patung", seed.phase, seed, index + 1)),
    ...reliefSeeds.map((seed, index) => makeTask("p_relief", seed.phase, seed, index + 1)),
    ...ukiranSeeds.map((seed, index) => makeTask("p_ukiran", seed.phase, seed, index + 1)),
    ...kateringSeeds.map((seed, index) => makeTask("p_katering", seed.phase, seed, index + 1)),
  ];

  const holidays: Holiday[] = [
    { id: "h_odalan", date: "2026-11-25", name: "Libur odalan banjar", source: "user" },
    { id: "h_natal", date: "2026-12-25", name: "Hari Raya Natal", source: "national" },
    { id: "h_tahun_baru", date: "2027-01-01", name: "Tahun Baru 2027", source: "national" },
  ];

  return {
    users: [
      {
        id: DEMO_USER_ID,
        name: "Made Arta",
        businessName: "Made Art Studio",
        email: "demo@tuntas.id",
        passwordHash: hash,
        salt,
        createdAt: NOW,
      },
    ],
    projects,
    phases,
    tasks,
    holidays,
  };
}
