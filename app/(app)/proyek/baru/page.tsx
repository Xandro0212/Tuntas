import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getHolidays, getProjectsForUser, getWorkspaceMembers } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { ProjectWizard } from "@/components/project-wizard";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "New project" : "Proyek baru" };
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ cerita?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/proyek");
  const lang = await getLang();
  const { cerita } = await searchParams;
  const projects = await getProjectsForUser(user, lang);
  const lastProject = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const [holidays, members] = await Promise.all([
    getHolidays(user.workspaceId, lang),
    getWorkspaceMembers(user.workspaceId),
  ]);
  const defaultTeam = Array.from(
    new Set([
      ...(lastProject?.team ?? []),
      ...members.filter((member) => member.id !== user.id).map((member) => member.name),
    ]),
  );

  return (
    <ProjectWizard
      user={user}
      holidays={holidays}
      defaultTeam={defaultTeam}
      defaultWorkdays={lastProject?.workdays ?? [1, 2, 3, 4, 5, 6]}
      autoFocusStory={cerita === "1"}
    />
  );
}
