import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProjectsForUser } from "@/lib/data";
import { getActiveProjectId } from "@/lib/active";

export const dynamic = "force-dynamic";

export default async function CalendarRedirect() {
  const user = await requireUser();
  const projects = await getProjectsForUser(user);
  if (!projects.length) redirect("/proyek/baru");
  const activeId = await getActiveProjectId();
  const selected =
    projects.find((project) => project.id === activeId) ??
    [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  redirect(`/proyek/${selected.id}/kalender`);
}
