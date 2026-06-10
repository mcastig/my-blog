import { db } from "@/lib/db";
import { comments, posts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { DeleteCommentButton } from "@/components/admin/DeleteCommentButton/DeleteCommentButton";

export default async function AdminCommentsPage() {
  const rows = await db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      email: comments.email,
      content: comments.content,
      status: comments.status,
      createdAt: comments.createdAt,
      postId: comments.postId,
      postTitle: posts.title,
      postSlug: posts.slug,
    })
    .from(comments)
    .leftJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {rows.length} comment{rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-lg py-16 text-center">
          <p className="text-[var(--color-muted)] text-sm">No comments yet</p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="text-left px-4 py-3 font-medium">Author</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Comment</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Post</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{c.authorName}</span>
                    {c.email && (
                      <span className="block text-xs text-[var(--color-muted)]">{c.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)] hidden md:table-cell max-w-xs">
                    <p className="truncate">{c.content}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)] hidden lg:table-cell max-w-[180px] truncate">
                    {c.postTitle ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)] hidden sm:table-cell whitespace-nowrap">
                    {format(c.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right w-px">
                    <DeleteCommentButton id={c.id} />
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
