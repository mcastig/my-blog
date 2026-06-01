import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import slugify from "slugify";

export async function GET() {
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = slugify(name.trim(), { lower: true, strict: true });

  try {
    const [cat] = await db.insert(categories).values({ name: name.trim(), slug }).returning();
    return NextResponse.json(cat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }
}
