import type { Lang } from "./i18n";

const DAY_MS = 86_400_000;

export const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const EN_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const EN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const ID_DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const ID_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
export const ID_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function parseISODate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, amount: number): string {
  return toISODate(new Date(parseISODate(value).getTime() + amount * DAY_MS));
}

export function weekdayIndex(value: string): number {
  return parseISODate(value).getUTCDay();
}

export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY_MS);
}

export function startOfWeekMonday(value: string): string {
  const day = weekdayIndex(value);
  const delta = day === 0 ? -6 : 1 - day;
  return addDays(value, delta);
}

export function formatLongDate(value: string, withWeekday = true, lang: Lang = "id"): string {
  const date = parseISODate(value);
  const months = lang === "en" ? EN_MONTHS : ID_MONTHS;
  const days = lang === "en" ? EN_DAYS : ID_DAYS;
  const body = `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return withWeekday ? `${days[date.getUTCDay()]}, ${body}` : body;
}

export function formatShortDate(value: string, lang: Lang = "id"): string {
  const date = parseISODate(value);
  const months = lang === "en" ? EN_MONTHS_SHORT : ID_MONTHS_SHORT;
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
}

export function formatDateRange(start: string, end: string, lang: Lang = "id"): string {
  if (start === end) return formatShortDate(start, lang);
  const a = parseISODate(start);
  const b = parseISODate(end);
  const months = lang === "en" ? EN_MONTHS_SHORT : ID_MONTHS_SHORT;
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${a.getUTCDate()}–${b.getUTCDate()} ${months[b.getUTCMonth()]}`;
  }
  return `${formatShortDate(start, lang)} – ${formatShortDate(end, lang)}`;
}

export function formatMonthTitle(value: string, lang: Lang = "id"): string {
  const date = parseISODate(value);
  const months = lang === "en" ? EN_MONTHS : ID_MONTHS;
  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactRupiah(value: number, lang: Lang = "id"): string {
  if (lang === "en") {
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1).replace(".0", "")}B`;
    }
    if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
    }
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}k`;
    return formatRupiah(value);
  }
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1).replace(".0", "")} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(".0", "")} jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} rb`;
  return formatRupiah(value);
}

export function relativeDeadline(deadline: string, lang: Lang = "id"): string {
  const delta = diffDays(todayISO(), deadline);
  if (lang === "en") {
    if (delta === 0) return "Today";
    if (delta === 1) return "Tomorrow";
    if (delta > 1) return `${delta} days left`;
    if (delta === -1) return "1 day overdue";
    return `${Math.abs(delta)} days overdue`;
  }
  if (delta === 0) return "Hari ini";
  if (delta === 1) return "Besok";
  if (delta > 1) return `${delta} hari lagi`;
  if (delta === -1) return "Lewat 1 hari";
  return `Lewat ${Math.abs(delta)} hari`;
}

export function normalizeWhatsApp(value: string): string {
  let digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.startsWith("8")) digits = `62${digits}`;
  return digits;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
