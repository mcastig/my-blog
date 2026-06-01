import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { PostCard } from "@/components/blog/PostCard/PostCard";
import type { Metadata } from "next";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";

  const results = term.length >= 2
    ? await db
        .select()
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(
          and(
            eq(posts.status, "published"),
            or(
              ilike(posts.title, `%${term}%`),
              ilike(posts.excerpt, `%${term}%`),
              ilike(posts.content, `%${term}%`)
            )
          )
        )
        .orderBy(desc(posts.publishedAt))
    : [];

  const postsWithCategory = results.map(({ posts: p, categories: c }) => ({
    ...p,
    category: c ?? null,
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)] mb-2">Search</p>
        <h1 className="text-4xl font-bold tracking-tight">
          {term ? `"${term}"` : "Search posts"}
        </h1>
        {term && (
          <p className="text-sm text-[var(--color-muted)] mt-2">
            {postsWithCategory.length === 0
              ? "No posts found."
              : `${postsWithCategory.length} result${postsWithCategory.length !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {postsWithCategory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {postsWithCategory.map((post, i) => (
            <PostCard key={post.id} post={post} priority={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
