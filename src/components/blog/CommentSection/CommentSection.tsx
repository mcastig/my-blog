"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Comment } from "@/lib/db/schema";

type Props = {
  postId: number;
  initialComments: Comment[];
};

const inputClass =
  "px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1";

function CommentForm({
  postId,
  parentCommentId,
  onPosted,
  compact,
  onCancel,
}: {
  postId: number;
  parentCommentId?: number;
  onPosted: (c: Comment) => void;
  compact?: boolean;
  onCancel?: () => void;
}) {
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
      body: JSON.stringify({ postId, parentCommentId: parentCommentId ?? null, authorName, email, content }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to post comment");
      setSubmitting(false);
      return;
    }

    const newComment: Comment = await res.json();
    onPosted(newComment);
    setAuthorName("");
    setEmail("");
    setContent("");
    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <div className={compact ? "" : "border border-[var(--color-border)] rounded-lg p-6"}>
      {!compact && <h3 className="text-sm font-semibold mb-5">Leave a comment</h3>}

      {success && (
        <p className="mb-4 text-sm text-green-600 dark:text-green-400">
          {compact ? "Reply posted." : "Comment posted successfully."}
        </p>
      )}

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Name *</label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              placeholder="Your name"
              className={inputClass}
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
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">
            {compact ? "Reply *" : "Comment *"}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={compact ? 3 : 4}
            placeholder={compact ? "Write a reply…" : "Share your thoughts…"}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !authorName.trim() || !content.trim()}
            className="px-4 py-2 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] rounded hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {submitting ? (compact ? "Posting…" : "Posting…") : compact ? "Post reply" : "Post comment"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export function CommentSection({ postId, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  function handlePosted(newComment: Comment) {
    setComments((prev) =>
      newComment.parentCommentId == null ? [newComment, ...prev] : [...prev, newComment]
    );
  }

  const topLevel = comments.filter((c) => c.parentCommentId == null);
  const repliesFor = (id: number) =>
    comments.filter((c) => c.parentCommentId === id);

  return (
    <section className="mt-16 pt-8 border-t border-[var(--color-border)]">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        {comments.length === 0 ? "Comments" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
      </h2>

      {topLevel.length > 0 && (
        <div className="flex flex-col gap-8 mb-12">
          {topLevel.map((c) => {
            const replies = repliesFor(c.id);
            const isReplying = replyingTo === c.id;
            return (
              <div key={c.id}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold">{c.authorName}</span>
                    <time className="text-xs text-[var(--color-muted)]" dateTime={c.createdAt.toString()}>
                      {format(new Date(c.createdAt), "MMMM d, yyyy")}
                    </time>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{c.content}</p>
                  <button
                    onClick={() => setReplyingTo(isReplying ? null : c.id)}
                    className="self-start mt-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                  >
                    {isReplying ? "Cancel reply" : "Reply"}
                  </button>
                </div>

                {(replies.length > 0 || isReplying) && (
                  <div className="mt-4 ml-6 pl-4 border-l-2 border-[var(--color-border)] flex flex-col gap-4">
                    {replies.map((r) => (
                      <div key={r.id} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-3">
                          <span className="text-sm font-semibold">{r.authorName}</span>
                          <time className="text-xs text-[var(--color-muted)]" dateTime={r.createdAt.toString()}>
                            {format(new Date(r.createdAt), "MMMM d, yyyy")}
                          </time>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{r.content}</p>
                      </div>
                    ))}

                    {isReplying && (
                      <CommentForm
                        postId={postId}
                        parentCommentId={c.id}
                        onPosted={(newReply) => {
                          handlePosted(newReply);
                          setReplyingTo(null);
                        }}
                        compact
                        onCancel={() => setReplyingTo(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CommentForm postId={postId} onPosted={handlePosted} />
    </section>
  );
}
