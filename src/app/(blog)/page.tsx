import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PostCard } from "@/components/blog/PostCard/PostCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export const revalidate = 60;

export default async function HomePage() {
  const allPosts = await db
    .select()
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(20);

  const postsWithCategory = allPosts.map(
    ({ posts: post, categories: category }) => ({
      ...post,
      category: category ?? null,
    }),
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {postsWithCategory.length === 0 ? (
        <p className="text-[var(--color-muted)]">
          No posts yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {postsWithCategory.map((post, i) => (
            <PostCard key={post.id} post={post} priority={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
