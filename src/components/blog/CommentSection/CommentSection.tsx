"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Comment } from "@/lib/db/schema";

type Props = {
  postId: number;
  initialComments: Comment[];
};

export function CommentSection({ postId, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, authorName, email, content }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to post comment");
      setSubmitting(false);
      return;
    }

    const newComment: Comment = await res.json();
    setComments((prev) => [newComment, ...prev]);
    setAuthorName("");
    setEmail("");
    setContent("");
    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <section className="mt-16 pt-8 border-t border-[var(--color-border)]">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        {comments.length === 0 ? "Comments" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
      </h2>

      {comments.length > 0 && (
        <div className="flex flex-col gap-6 mb-12">
          {comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold">{c.authorName}</span>
                <time className="text-xs text-[var(--color-muted)]" dateTime={c.createdAt.toString()}>
                  {format(new Date(c.createdAt), "MMMM d, yyyy")}
                </time>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-5">Leave a comment</h3>

        {success && (
          <p className="mb-4 text-sm text-green-600 dark:text-green-400">
            Comment posted successfully.
          </p>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
                Name *
              </label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                placeholder="Your name"
                className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
                Email <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
              Comment *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Share your thoughts…"
              className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !authorName.trim() || !content.trim()}
            className="self-start px-4 py-2 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] rounded hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      </div>
    </section>
  );
}
