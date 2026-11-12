import Link from "next/link";
import { getInviteByToken } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { translate } from "@/lib/i18n";
import { Logo } from "@/components/logo";
import { JoinForm } from "@/components/join-form";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "Join team" : "Gabung tim" };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lang = await getLang();
  const t = (source: string, vars?: Record<string, string | number>) =>
    translate(lang, source, vars);
  const invite = await getInviteByToken(token);
  const now = new Date().toISOString();
  const valid = Boolean(
    invite && !invite.usedAt && invite.expiresAt > now,
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-[460px] p-6 sm:p-8">
        <Link href="/" className="inline-flex" aria-label={t("Tuntas — beranda")}>
          <Logo variant="dark" size="md" />
        </Link>
        <div className="mt-7">
          <div className="section-title">{t("Undangan tim")}</div>
          <h1 className="mt-2 text-[27px] font-extrabold tracking-[-0.04em]">
            {t("Gabung ke Tuntas")}
          </h1>
          {invite && valid ? (
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              {t(
                "Kamu diundang sebagai karyawan. Buat password untuk mulai memakai workspace.",
              )}
            </p>
          ) : (
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              {t("Undangan ini tidak valid atau sudah kedaluwarsa.")}
            </p>
          )}
        </div>

        {invite && valid ? (
          <JoinForm
            token={token}
            email={invite.email}
            defaultName={invite.name}
          />
        ) : (
          <Link href="/login" className="btn-secondary mt-6 w-full">
            {t("Kembali ke login")}
          </Link>
        )}
      </div>
    </div>
  );
}
