import { History } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getWorkspaceActivities } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { translate } from "@/lib/i18n";
import type { ActivityAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "Activity" : "Aktivitas" };
}

const ACTION_LABEL: Record<ActivityAction, string> = {
  "project.create": "membuat proyek",
  "project.update": "memperbarui proyek",
  "project.delete": "menghapus proyek",
  "task.create": "menambah tugas",
  "task.update": "memperbarui tugas",
  "task.delete": "menghapus tugas",
  "phase.create": "menambah tahap",
  "phase.update": "memperbarui tahap",
  "phase.delete": "menghapus tahap",
  "holiday.create": "menambah hari libur",
  "holiday.delete": "menghapus hari libur",
  "employee.create": "menambah karyawan",
  "employee.delete": "menghapus karyawan",
  "invite.create": "membuat undangan",
  "invite.accept": "menerima undangan",
  "invite.delete": "mencabut undangan",
  "schedule.update": "menyusun ulang jadwal",
};

export default async function ActivityPage() {
  const user = await requireUser();
  const lang = await getLang();
  const t = (source: string) => translate(lang, source);
  const activities = await getWorkspaceActivities(user.workspaceId);

  return (
    <div className="space-y-5">
      <div>
        <div className="section-title">{t("Jejak perubahan")}</div>
        <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.04em] sm:text-[32px]">
          {t("Aktivitas")}
        </h1>
        <p className="mt-1 text-[12.5px] text-muted">
          {t("Perubahan penting di workspace ini, terbaru di atas.")}
        </p>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <History className="h-4 w-4 text-green" />
          <span className="text-[12px] font-bold text-ink">{t("Terbaru")}</span>
          <span className="chip-sm ml-auto bg-paper-2 text-muted">{activities.length}</span>
        </div>
        {activities.length ? (
          <div className="divide-y divide-line">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 px-4 py-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] leading-relaxed text-ink-2">
                    <span className="font-bold text-ink">{activity.userName}</span>{" "}
                    {t(ACTION_LABEL[activity.action])}{" "}
                    <span className="font-semibold text-ink">{activity.detail}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted">
                    {new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(activity.createdAt))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-[12px] text-muted">
            {t("Belum ada aktivitas.")}
          </div>
        )}
      </section>
    </div>
  );
}
