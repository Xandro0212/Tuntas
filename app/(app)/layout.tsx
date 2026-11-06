import { requireUser } from "@/lib/auth";
import { getProjectsForUser } from "@/lib/data";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const projects = getProjectsForUser(user.id).map((project) => ({
    id: project.id,
    title: project.title,
    clientName: project.clientName,
    deadline: project.deadline,
  }));

  return (
    <AppShell user={user} projects={projects}>
      {children}
    </AppShell>
  );
}
