import { getSessionUser } from "@/lib/auth";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tuntas — Dari cerita klien jadi rencana yang tuntas",
  description:
    "Kanban + kalender proyek klien untuk UMKM. AI memecah cerita proyek menjadi tugas, tanggal dihitung mundur dari deadline, Minggu dan hari libur dilewati.",
};

export default async function HomePage() {
  const user = await getSessionUser();
  return <LandingPage isLoggedIn={Boolean(user)} userName={user?.name ?? null} />;
}
