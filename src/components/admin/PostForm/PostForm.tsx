"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Category, Post } from "@/lib/db/schema";
import slugify from "slugify";

type Props = {
  categories: Category[];
  post?: Post;
};

export function PostForm({ categories, post }: Props) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [author, setAuthor] = useState(post?.author ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [categoryId, setCategoryId] = useState(String(post?.categoryId ?? ""));
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    (post?.status as "draft" | "published") ?? "draft"
  );
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const autoSlug = useCallback((val: string) => {
    if (!isEdit || !slug) {
      setSlug(slugify(val, { lower: true, strict: true }));
    }
  }, [isEdit, slug]);

  async function uploadImage(file: File) {
    setUploadProgress(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploadProgress(false);
    if (!res.ok) { setError("Image upload failed"); return; }
    const { url } = await res.json();
    setFeaturedImage(url);
  }

  async function save(saveStatus: "draft" | "published") {
    setSaving(true);
    setError("");

    const body = { title, slug, author, excerpt, content, categoryId: categoryId || null, featuredImage, status: saveStatus };
    const url = isEdit ? `/api/posts/${post.id}` : "/api/posts";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Title *</label>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); autoSlug(e.target.value); }}
          placeholder="Post title"
          className="px-3 py-2 text-lg font-semibold border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1"
        />
      </div>

      {/* Slug + Category row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value, { lower: true, strict: true }))}
            placeholder="friendly-url-slug"
            className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1 font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Author */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Author</label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author name"
          className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1"
        />
      </div>

      {/* Excerpt */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary shown in post listings…"
          rows={2}
          className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1 resize-none"
        />
      </div>

      {/* Featured Image */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Featured Image</label>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="/uploads/image.jpg or external URL"
            className="flex-1 min-w-0 px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadProgress}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {uploadProgress ? "Uploading…" : "Upload file"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
          />
        </div>
        {featuredImage && (
          <img src={featuredImage} alt="Preview" className="h-28 w-auto object-cover rounded border border-[var(--color-border)]" />
        )}
      </div>

      {/* Editor */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Content (Markdown)</label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors border border-[var(--color-border)] px-2.5 py-1 rounded"
          >
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[400px] px-4 py-4 border border-[var(--color-border)] rounded prose bg-[var(--color-background)] overflow-auto">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-[var(--color-muted)] text-sm italic">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post in Markdown…&#10;&#10;## Heading&#10;&#10;Paragraph text, **bold**, *italic*, `code`&#10;&#10;- List item"
            rows={22}
            className="px-3 py-3 text-sm font-mono border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1 resize-y leading-relaxed"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => save("draft")}
          disabled={saving || !title}
          className="px-4 py-2 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => save("published")}
          disabled={saving || !title || !content}
          className="px-4 py-2 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] rounded hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? "Publishing…" : status === "published" ? "Update & publish" : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="ml-auto text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
