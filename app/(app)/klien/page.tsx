import Link from "next/link";
import { ArrowRight, MessageCircle, Plus, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getClients, getProjectBundle } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { translate } from "@/lib/i18n";
import {
  formatCompactRupiah,
  formatLongDate,
  normalizeWhatsApp,
  relativeDeadline,
  todayISO,
} from "@/lib/dates";
import { Avatar } from "@/components/avatar";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "Clients" : "Klien" };
}

export default async function ClientsPage() {
  const user = await requireUser();
  const lang = await getLang();
  const t = (source: string, vars?: Record<string, string | number>) =>
    translate(lang, source, vars);
  const clients = getClients(user.id);
  const today = todayISO();
  const summaries = new Map(
    clients
      .flatMap((client) => client.projects)
      .map((project) => [project.id, getProjectBundle(user.id, project.id)!]),
  );
  const totalValue = clients.reduce((sum, client) => sum + client.totalValue, 0);
  const activeProjects = clients.reduce(
    (sum, client) =>
      sum + client.projects.filter((project) => project.deadline >= today).length,
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="section-title">{t("Buku alamat")}</div>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.04em] sm:text-[32px]">
            {t("Klien")}
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {t("{clients} klien · {active} proyek berjalan · {value} modal tercatat.", {
              clients: clients.length,
              active: activeProjects,
              value: formatCompactRupiah(totalValue),
            })}
          </p>
        </div>
        <Link href="/proyek/baru" className="btn-primary shrink-0">
          <Plus className="h-4 w-4" /> {t("Proyek baru")}
        </Link>
      </div>

      {clients.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {clients.map((client) => {
            const wa = normalizeWhatsApp(client.wa);
            const active = client.projects.filter((project) => project.deadline >= today);
            return (
              <article key={client.key} className="panel overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <Avatar name={client.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-bold tracking-[-0.015em]">{client.name}</h2>
                      <span className="chip-sm bg-paper-2 text-muted">
                        {client.projects.length === 1
                          ? t("1 proyek")
                          : t("{n} proyek", { n: client.projects.length })}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {client.wa || t("Nomor WhatsApp belum diisi")} ·{" "}
                      {formatCompactRupiah(client.totalValue)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary btn-xs"
                        >
                          <MessageCircle className="h-3 w-3" /> {t("Chat WhatsApp")}
                        </a>
                      )}
                      <Link
                        href={`/proyek/${client.projects[0].id}`}
                        className="btn-ghost btn-xs"
                      >
                        {t("Buka proyek")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      {t("Deadline dekat")}
                    </div>
                    <div className="mt-1 text-[11.5px] font-bold text-ink">
                      {active.length
                        ? formatLongDate(
                            [...active].sort((a, b) => a.deadline.localeCompare(b.deadline))[0]
                              .deadline,
                            false,
                            lang,
                          )
                        : t("Tidak ada")}
                    </div>
                  </div>
                </div>

                <div className="border-t border-line bg-paper px-4 py-2.5">
                  <div className="space-y-1.5">
                    {client.projects.map((project) => {
                      const summary = summaries.get(project.id)?.summary;
                      const late = project.deadline < today && (summary?.progress ?? 0) < 100;
                      return (
                        <Link
                          key={project.id}
                          href={`/proyek/${project.id}`}
                          className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-white"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              late ? "bg-rust" : "bg-green"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11.5px] font-semibold text-ink-2">
                              {project.title}
                            </span>
                            <span className="block text-[9.5px] text-muted">
                              {formatLongDate(project.deadline, false, lang)} ·{" "}
                              {relativeDeadline(project.deadline, lang)}
                            </span>
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold text-muted">
                            {summary ? `${summary.done}/${summary.total}` : "—"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-green">
            <Users className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-[18px] font-bold">{t("Belum ada klien")}</h2>
          <p className="mt-1 max-w-[360px] text-[12px] leading-relaxed text-muted">
            {t("Klien muncul otomatis saat kamu membuat proyek. Mulai dari satu cerita pesanan.")}
          </p>
          <Link href="/proyek/baru" className="btn-primary mt-4">
            <Plus className="h-4 w-4" /> {t("Buat proyek")}
          </Link>
        </div>
      )}
    </div>
  );
}
