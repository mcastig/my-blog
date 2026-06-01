import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { Post, Category } from "@/lib/db/schema";

type PostWithCategory = Post & { category: Category | null };

function getIntro(post: PostWithCategory): string {
  if (post.excerpt) return post.excerpt;
  const plain = post.content.replace(/[#*`_~\[\]>!\-]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > 160 ? plain.slice(0, 160).trimEnd() + "…" : plain;
}

export function PostCard({ post, priority = false }: { post: PostWithCategory; priority?: boolean }) {
  const intro = getIntro(post);
  return (
    <article className="group flex flex-col gap-3 border-b border-[var(--color-border)] pb-8">
      {post.featuredImage && (
        <Link href={`/${post.slug}`} className="block overflow-hidden aspect-[16/9] bg-[var(--color-surface)]">
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={800}
            height={450}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
          />
        </Link>
      )}
      <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
        {post.category && (
          <Link href={`/category/${post.category.slug}`} className="uppercase tracking-widest font-medium hover:text-[var(--color-foreground)] transition-colors">
            {post.category.name}
          </Link>
        )}
        {post.category && <span>·</span>}
        <time dateTime={post.publishedAt?.toISOString()}>
          {format(post.publishedAt ?? post.createdAt, "MMMM d, yyyy")}
        </time>
      </div>
      <Link href={`/${post.slug}`}>
        <h2 className="text-xl font-bold tracking-tight leading-snug group-hover:opacity-60 transition-opacity">
          {post.title}
        </h2>
      </Link>
      {intro && (
        <p className="text-[var(--color-muted)] text-sm leading-relaxed line-clamp-3">{intro}</p>
      )}
      <Link href={`/${post.slug}`} className="text-xs font-medium underline underline-offset-4 hover:opacity-60 transition-opacity self-start">
        Read more
      </Link>
    </article>
  );
}
