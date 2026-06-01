import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { firstName, lastName } = await req.json();

  await db
    .update(adminUsers)
    .set({ firstName: firstName ?? null, lastName: lastName ?? null })
    .where(eq(adminUsers.id, session.userId));

  return NextResponse.json({ ok: true });
}
