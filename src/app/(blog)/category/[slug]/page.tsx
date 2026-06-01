import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/PostCard/PostCard";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return { title: cat[0]?.name ?? "Category" };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const cat = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat[0]) notFound();

  const allPosts = await db
    .select()
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.status, "published"), eq(posts.categoryId, cat[0].id)))
    .orderBy(desc(posts.publishedAt));

  const postsWithCategory = allPosts.map(({ posts: post, categories: category }) => ({
    ...post,
    category: category ?? null,
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-16">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)] mb-2">Category</p>
        <h1 className="text-4xl font-bold tracking-tight">{cat[0].name}</h1>
      </div>
      {postsWithCategory.length === 0 ? (
        <p className="text-[var(--color-muted)]">No posts in this category yet.</p>
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
