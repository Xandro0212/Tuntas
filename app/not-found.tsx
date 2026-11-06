import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "Page not found" : "Halaman tidak ditemukan" };
}

export default async function NotFoundPage() {
  const lang = await getLang();
  const copy =
    lang === "en"
      ? {
          eyebrow: "404",
          title: "Page not found",
          description: "The page you are looking for does not exist or has moved.",
          back: "Back to workspace",
        }
      : {
          eyebrow: "404",
          title: "Halaman tidak ditemukan",
          description: "Halaman yang kamu cari tidak ada atau sudah dipindahkan.",
          back: "Kembali ke ruang kerja",
        };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="panel w-full max-w-[460px] p-7 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-green">
          {copy.eyebrow}
        </div>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em] text-ink">
          {copy.title}
        </h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{copy.description}</p>
        <Link href="/" className="btn-primary mt-5">
          <ArrowLeft className="h-3.5 w-3.5" /> {copy.back}
        </Link>
      </div>
    </div>
  );
}
