import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { PostContent } from "@/components/blog/PostContent/PostContent";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);
  if (!result[0]) return { title: "Not Found" };
  return {
    title: result[0].title,
    description: result[0].excerpt ?? undefined,
    openGraph: {
      images: result[0].featuredImage ? [result[0].featuredImage] : [],
    },
  };
}

export const revalidate = 60;

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  const result = await db
    .select()
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (!result[0]) notFound();

  const { posts: post, categories: category } = result[0];

  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)] mb-5">
          {category && (
            <>
              <Link
                href={`/category/${category.slug}`}
                className="uppercase tracking-widest font-medium hover:text-[var(--color-foreground)] transition-colors"
              >
                {category.name}
              </Link>
              <span>·</span>
            </>
          )}
          <time dateTime={post.publishedAt?.toISOString()}>
            {format(post.publishedAt ?? post.createdAt, "MMMM d, yyyy")}
          </time>
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-tight mb-6">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-xl text-[var(--color-muted)] leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </header>

      {post.featuredImage && (
        <div className="mb-12 aspect-[16/9] overflow-hidden bg-[var(--color-surface)]">
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={800}
            height={450}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}

      <PostContent content={post.content} />

      <div className="mt-16 pt-8 border-t border-[var(--color-border)]">
        <Link
          href="/"
          className="text-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          ← Back to all posts
        </Link>
      </div>
    </article>
  );
}
