import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/language-provider";
import { getLang } from "@/lib/lang-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: {
      default:
        lang === "en"
          ? "Tuntas — From a client story to a plan that gets done"
          : "Tuntas — Dari cerita klien jadi rencana yang tuntas",
      template: "%s · Tuntas",
    },
    description:
      lang === "en"
        ? "Kanban + project calendar for small businesses. AI turns a project story into tasks, with dates counted backward from the deadline."
        : "Kanban + kalender proyek klien untuk UMKM. AI memecah cerita proyek menjadi tugas, tanggal dihitung mundur dari deadline.",
    applicationName: "Tuntas",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5fc",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        <Toaster position="top-center" theme="light" richColors closeButton />
      </body>
    </html>
  );
}
