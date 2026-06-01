import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const results = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      publishedAt: posts.publishedAt,
      categoryName: categories.name,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(
      and(
        eq(posts.status, "published"),
        or(
          ilike(posts.title, `%${q}%`),
          ilike(posts.excerpt, `%${q}%`),
          ilike(posts.content, `%${q}%`)
        )
      )
    )
    .limit(8);

  return NextResponse.json(results);
}
