import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProjectBundle, getProjectsForUser, getWorkspaceMembers } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { ProjectTracker } from "@/components/project-tracker";
import { KanbanView } from "@/components/kanban-view";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const lang = await getLang();
  const bundle = await getProjectBundle(user, id, lang);
  return { title: bundle?.project.title ?? (lang === "en" ? "Project" : "Proyek") };
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const user = await requireUser();
  const lang = await getLang();
  const bundle = await getProjectBundle(user, id, lang);
  if (!bundle) notFound();

  const [projects, members] = await Promise.all([
    getProjectsForUser(user, lang),
    getWorkspaceMembers(user.workspaceId),
  ]);

  return (
    <>
      <ProjectTracker projectId={id} />
      <KanbanView
        project={bundle.project}
        phases={bundle.phases}
        initialTasks={bundle.tasks}
        holidays={bundle.holidays}
        projects={projects.map((project) => ({ id: project.id, title: project.title }))}
        view={view === "daftar" ? "daftar" : "kanban"}
        businessName={user.businessName}
        today={todayISO()}
        user={user}
        members={members}
        canManage={user.role === "owner"}
      />
    </>
  );
}
