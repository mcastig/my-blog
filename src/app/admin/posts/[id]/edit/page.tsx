import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm/PostForm";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit Post — Admin" };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const [post, cats] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, Number(id))).limit(1),
    db.select().from(categories).orderBy(asc(categories.name)),
  ]);

  if (!post[0]) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Edit Post</h1>
      <PostForm categories={cats} post={post[0]} />
    </div>
  );
}
