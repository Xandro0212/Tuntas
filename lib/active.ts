import { cookies } from "next/headers";

const COOKIE_NAME = "tuntas_project";

export async function getActiveProjectId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function setActiveProjectCookie(projectId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, projectId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
