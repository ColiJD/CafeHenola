// /middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";


export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 🔒 Rutas de admin
  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 🔒 Rutas de manager (opcional)
  if (pathname.startsWith("/manager")) {
    if (!token || (token.role !== "MANAGER" && token.role !== "ADMIN")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

// Especifica qué rutas protege el middleware
export const config = {
  matcher: ["/admin/:path*", "/manager/:path*"],
};
