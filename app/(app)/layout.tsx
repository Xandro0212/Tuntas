import { requireUser } from "@/lib/auth";
import { getProjectsForUser } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { AppShell } from "@/components/app-shell";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const lang = await getLang();
  const projects = (await getProjectsForUser(user, lang)).map((project) => ({
    id: project.id,
    title: project.title,
    clientName: project.clientName,
    deadline: project.deadline,
  }));

  return (
    <AppShell user={user} projects={projects}>
      <AutoRefresh />
      {children}
    </AppShell>
  );
}
