import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import slugify from "slugify";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const post = await db.select().from(posts).where(eq(posts.id, Number(id))).limit(1);
  if (!post[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post[0]);
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { title, slug: rawSlug, content, excerpt, categoryId, featuredImage, status } = body;

    const existing = await db.select().from(posts).where(eq(posts.id, Number(id))).limit(1);
    if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = rawSlug
      ? slugify(rawSlug, { lower: true, strict: true })
      : existing[0].slug;

    const wasPublished = existing[0].status === "published";
    const willPublish = status === "published";
    const now = new Date();

    const [updated] = await db
      .update(posts)
      .set({
        title: title ?? existing[0].title,
        slug,
        content: content ?? existing[0].content,
        excerpt: excerpt !== undefined ? excerpt || null : existing[0].excerpt,
        categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : existing[0].categoryId,
        featuredImage: featuredImage !== undefined ? featuredImage || null : existing[0].featuredImage,
        status: willPublish ? "published" : "draft",
        publishedAt: willPublish && !wasPublished ? now : existing[0].publishedAt,
        updatedAt: now,
      })
      .where(eq(posts.id, Number(id)))
      .returning();

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("unique")) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(posts).where(eq(posts.id, Number(id)));
  return NextResponse.json({ ok: true });
}
