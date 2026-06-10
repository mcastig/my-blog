import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, posts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId || isNaN(Number(postId))) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(comments)
    .where(and(eq(comments.postId, Number(postId)), eq(comments.status, "approved")))
    .orderBy(desc(comments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, authorName, email, content } = body;

    if (!postId || !authorName?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "postId, authorName, and content are required" }, { status: 400 });
    }

    const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, Number(postId))).limit(1);
    if (!post[0]) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const [comment] = await db
      .insert(comments)
      .values({
        postId: Number(postId),
        authorName: authorName.trim(),
        email: email?.trim() || null,
        content: content.trim(),
      })
      .returning();

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
