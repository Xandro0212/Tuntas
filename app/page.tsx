import { getSessionUser } from "@/lib/auth";
import { getLang } from "@/lib/lang-server";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getLang();
  return {
    title:
      lang === "en"
        ? "Tuntas — Your AI Companion for Getting Things Done"
        : "Tuntas — Kerja Lebih Cerdas, Hasil Lebih Tuntas",
    description:
      lang === "en"
        ? "Kanban + client project calendar for small businesses. AI turns a project story into tasks, counting dates backward from the deadline and skipping Sundays and holidays."
        : "Kanban + kalender proyek klien untuk UMKM. AI memecah cerita proyek menjadi tugas, tanggal dihitung mundur dari deadline, Minggu dan hari libur dilewati.",
  };
}

export default async function HomePage() {
  const user = await getSessionUser();
  return <LandingPage isLoggedIn={Boolean(user)} userName={user?.name ?? null} />;
}
