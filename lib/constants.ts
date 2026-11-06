import type { Category, TaskStatus, TaskType } from "./types";

export const STATUSES: { id: TaskStatus; label: string; hint: string }[] = [
  { id: "todo", label: "Belum mulai", hint: "Belum disentuh" },
  { id: "doing", label: "Sedang dikerjakan", hint: "Sedang jalan" },
  { id: "waiting", label: "Menunggu klien", hint: "Bola di klien" },
  { id: "done", label: "Selesai", hint: "Sudah beres" },
];

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  internal: "Internal",
  waiting_client: "Menunggu klien",
  vendor: "Vendor",
  payment: "Pembayaran",
  delivery: "Pengiriman",
};

export const TASK_TYPE_COLOR: Record<TaskType, string> = {
  internal: "#6d28d9",
  waiting_client: "#d97706",
  vendor: "#2563eb",
  payment: "#b45309",
  delivery: "#be123c",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  kerajinan: "Produksi kerajinan",
  katering: "Katering & acara",
  konveksi: "Konveksi & seragam",
  jasa: "Jasa",
  lainnya: "Lainnya",
};

export const CATEGORY_OPTIONS: { id: Category; label: string; hint: string }[] = [
  { id: "kerajinan", label: "Produksi & kerajinan", hint: "Patung, relief, mebel, craft" },
  { id: "katering", label: "Katering & acara", hint: "Nasi kotak, prasmanan, event" },
  { id: "konveksi", label: "Konveksi & seragam", hint: "Jahit, sablon, bordir" },
  { id: "jasa", label: "Jasa & desain", hint: "Konsultasi, dekorasi, konten" },
  { id: "lainnya", label: "Lainnya", hint: "Usaha lain yang punya deadline" },
];

interface PhaseTone {
  bg: string;
  text: string;
  dot: string;
  border: string;
}

const TONES: Record<string, PhaseTone> = {
  blue: { bg: "#eff4ff", text: "#1d4ed8", dot: "#60a5fa", border: "#dbe7fe" },
  green: { bg: "#eef2ff", text: "#4338ca", dot: "#6366f1", border: "#dfe5ff" },
  orange: { bg: "#fff7ed", text: "#c2410c", dot: "#fb923c", border: "#ffedd5" },
  violet: { bg: "#f5f3ff", text: "#6d28d9", dot: "#8b5cf6", border: "#ede9fe" },
  gold: { bg: "#fffbeb", text: "#b45309", dot: "#fbbf24", border: "#fef3c7" },
  teal: { bg: "#ecfeff", text: "#0e7490", dot: "#22d3ee", border: "#cffafe" },
};

const TONE_ORDER = ["blue", "green", "orange", "violet", "gold", "teal"];

export function phaseTone(name: string, index = 0): PhaseTone {
  const lower = name.toLowerCase();
  if (/(desain|persiapan|brief|menu)/.test(lower)) return TONES.blue;
  if (/(belanja|bahan)/.test(lower)) return TONES.gold;
  if (/(finishing|qc|packing)/.test(lower)) return TONES.orange;
  if (/(kirim|pemasangan|acara|serah)/.test(lower)) return TONES.violet;
  if (/(produksi|eksekusi|jahit|masak|ukir|cetak)/.test(lower)) return TONES.green;
  return TONES[TONE_ORDER[index % TONE_ORDER.length]];
}

export function avatarColor(name: string): { bg: string; text: string } {
  const palette = [
    { bg: "#6d28d9", text: "#ffffff" },
    { bg: "#4338ca", text: "#ffffff" },
    { bg: "#be123c", text: "#ffffff" },
    { bg: "#b45309", text: "#ffffff" },
    { bg: "#0369a1", text: "#ffffff" },
    { bg: "#a21caf", text: "#ffffff" },
  ];
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return palette[sum % palette.length];
}

export const WORKDAY_LABELS = [
  { id: 1, label: "Sen" },
  { id: 2, label: "Sel" },
  { id: 3, label: "Rab" },
  { id: 4, label: "Kam" },
  { id: 5, label: "Jum" },
  { id: 6, label: "Sab" },
];
