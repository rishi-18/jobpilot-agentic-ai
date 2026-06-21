import { NextResponse, type NextRequest } from "next/server";

import { createServerClient, updateSession } from "@insforge/sdk/ssr";

const protectedRoutes = ["/dashboard", "/profile", "/find-jobs"];

function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next({ request });
  const requestCookies = {
    get(name: string) {
      return request.cookies.get(name);
    },
  };

  const session = await updateSession({
    requestCookies,
    responseCookies: response.cookies,
  });
  const insforge = createServerClient({
    cookies: requestCookies,
    accessToken: session.accessToken ?? undefined,
  });
  const { data } = await insforge.auth.getCurrentUser();
  const isAuthed = Boolean(data.user);

  if (pathname === "/login" && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath(pathname) && !isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/find-jobs/:path*", "/login"],
};