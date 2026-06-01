import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import slugify from "slugify";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const all = await db
      .select()
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.createdAt));

    return NextResponse.json(all.map(({ posts: p, categories: c }) => ({ ...p, category: c ?? null })));
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, slug: rawSlug, content, excerpt, categoryId, featuredImage, status } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const slug = rawSlug
      ? slugify(rawSlug, { lower: true, strict: true })
      : slugify(title, { lower: true, strict: true });

    const now = new Date();
    const [post] = await db
      .insert(posts)
      .values({
        title,
        slug,
        content: content ?? "",
        excerpt: excerpt || null,
        categoryId: categoryId ? Number(categoryId) : null,
        featuredImage: featuredImage || null,
        status: status === "published" ? "published" : "draft",
        publishedAt: status === "published" ? now : null,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(post, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("unique")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
