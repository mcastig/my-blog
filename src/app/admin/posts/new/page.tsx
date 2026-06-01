import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { PostForm } from "@/components/admin/PostForm/PostForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Post — Admin" };

export default async function NewPostPage() {
  const cats = await db.select().from(categories).orderBy(asc(categories.name));

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-8">New Post</h1>
      <PostForm categories={cats} />
    </div>
  );
}
