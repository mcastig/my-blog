import { db } from "@/lib/db";
import { posts, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { format } from "date-fns";
import { DeletePostButton } from "@/components/admin/DeletePostButton/DeletePostButton";

export default async function AdminDashboard() {
  const all = await db
    .select()
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .orderBy(desc(posts.createdAt));

  const rows = all.map(({ posts: p, categories: c }) => ({ ...p, category: c ?? null }));

  const published = rows.filter((p) => p.status === "published").length;
  const drafts = rows.filter((p) => p.status === "draft").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {published} published · {drafts} draft{drafts !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] rounded hover:opacity-80 transition-opacity"
        >
          New post
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-lg py-16 text-center">
          <p className="text-[var(--color-muted)] text-sm mb-4">No posts yet</p>
          <Link href="/admin/posts/new" className="text-sm underline underline-offset-4">
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((post, i) => (
                <tr
                  key={post.id}
                  className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors ${i % 2 === 0 ? "" : ""}`}
                >
                  <td className="px-4 py-3 font-medium max-w-[260px] truncate">{post.title}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)] hidden md:table-cell">
                    {post.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-[var(--color-surface)] text-[var(--color-muted)]"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)] hidden sm:table-cell whitespace-nowrap">
                    {format(post.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-right w-px whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3 sm:gap-4">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-xs font-medium underline underline-offset-4 hover:opacity-60 transition-opacity"
                      >
                        Edit
                      </Link>
                      <DeletePostButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
