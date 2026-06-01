import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
    if (!user[0]) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, user[0].passwordHash);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await signToken({ userId: user[0].id, username: user[0].username });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
