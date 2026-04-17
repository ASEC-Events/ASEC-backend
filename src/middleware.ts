import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token");
  
  const isOnProtectedRoute = request.nextUrl.pathname.startsWith("/main");
  const isOnLoginPage = request.nextUrl.pathname === "/login";

  if (isOnProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isOnLoginPage && authToken) {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/main/:path*", "/login"],
};