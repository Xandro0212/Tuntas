import { requireUser } from "@/lib/auth";
import { getHolidays, getProjectsForUser } from "@/lib/data";
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
  const lang = await getLang();
  const { cerita } = await searchParams;
  const projects = await getProjectsForUser(user.id, lang);
  const lastProject = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const holidays = await getHolidays(lang);

  return (
    <ProjectWizard
      user={user}
      holidays={holidays}
      defaultTeam={lastProject?.team ?? []}
      defaultWorkdays={lastProject?.workdays ?? [1, 2, 3, 4, 5, 6]}
      autoFocusStory={cerita === "1"}
    />
  );
}
