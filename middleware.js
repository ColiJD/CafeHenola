import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Permitir login y APIs públicas
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Si no hay token, redirige al login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Manager
  if (
    pathname.startsWith("/manager") &&
    token.role !== "MANAGER" &&
    token.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|login|api/auth).*)"],
};
