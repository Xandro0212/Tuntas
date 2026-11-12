import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWorkspace, getWorkspaceMembers } from "@/lib/data";
import { getLang } from "@/lib/lang-server";
import { translate } from "@/lib/i18n";
import { TeamManager } from "@/components/team-manager";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const lang = await getLang();
  return { title: lang === "en" ? "Team" : "Tim" };
}

export default async function TeamPage() {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/hari-ini");
  const lang = await getLang();
  const t = (source: string) => translate(lang, source);
  const [members, workspace] = await Promise.all([
    getWorkspaceMembers(user.workspaceId),
    getWorkspace(user.workspaceId),
  ]);

  return (
    <TeamManager
      initialMembers={members}
      workspaceName={workspace?.name ?? user.businessName}
      currentUserId={user.id}
      title={t("Tim")}
    />
  );
}
