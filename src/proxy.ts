import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("blog_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));

    const session = await verifyToken(token);
    if (!session) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("blog_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
