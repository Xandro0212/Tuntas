import { NextResponse, type NextRequest } from "next/server";

/**
 * CSRF guard for mutating API requests.
 *
 * Modern browsers send Origin/Sec-Fetch-Site on cross-site requests. Requests
 * from the same origin are allowed; requests from another site are blocked.
 * Non-browser clients without those headers remain compatible.
 */
export function proxy(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return NextResponse.next();
  }

  const site = request.headers.get("sec-fetch-site");
  if (site && !["same-origin", "same-site", "none"].includes(site)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const host = request.headers.get("host");
      if (!host || new URL(origin).host !== host) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } catch {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
