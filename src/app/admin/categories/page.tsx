import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { CategoryManager } from "@/components/admin/CategoryManager/CategoryManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories — Admin" };

export default async function CategoriesPage() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      createdAt: categories.createdAt,
      postCount: sql<number>`cast(count(${posts.id}) as int)`,
    })
    .from(categories)
    .leftJoin(posts, eq(posts.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {rows.length} {rows.length === 1 ? "category" : "categories"}
        </p>
      </div>
      <CategoryManager initialCategories={rows} />
    </div>
  );
}
