import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProjectBundle, getProjectsForUser } from "@/lib/data";
import { ProjectTracker } from "@/components/project-tracker";
import { KanbanView } from "@/components/kanban-view";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const bundle = getProjectBundle(user.id, id);
  return { title: bundle?.project.title ?? "Proyek" };
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
  const bundle = getProjectBundle(user.id, id);
  if (!bundle) notFound();

  const projects = getProjectsForUser(user.id).map((project) => ({
    id: project.id,
    title: project.title,
  }));

  return (
    <>
      <ProjectTracker projectId={id} />
      <KanbanView
        project={bundle.project}
        phases={bundle.phases}
        initialTasks={bundle.tasks}
        holidays={bundle.holidays}
        projects={projects}
        view={view === "daftar" ? "daftar" : "kanban"}
        businessName={user.businessName}
        today={todayISO()}
      />
    </>
  );
}
