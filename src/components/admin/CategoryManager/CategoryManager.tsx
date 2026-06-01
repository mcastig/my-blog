"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/db/schema";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type CategoryWithCount = Category & { postCount: number };

export function CategoryManager({ initialCategories }: { initialCategories: CategoryWithCount[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);

  // Add form
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setAddError("");

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (res.ok) {
      const created = await res.json();
      setCategories((prev) => [...prev, { ...created, postCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      router.refresh();
    } else {
      const json = await res.json();
      setAddError(json.error ?? "Failed to create");
    }
    setAdding(false);
  }

  function startEdit(cat: CategoryWithCount) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditError("");
  }

  async function handleSaveEdit(id: number) {
    if (!editName.trim()) return;
    setSaving(true);
    setEditError("");

    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });

    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...updated, postCount: c.postCount } : c))
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      router.refresh();
    } else {
      const json = await res.json();
      setEditError(json.error ?? "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
    <div className="flex flex-col gap-8">
      {/* Add category form */}
      <div className="border border-[var(--color-border)] rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Add category</h2>
        <form onSubmit={handleAdd} className="flex gap-3 items-start flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
              placeholder="Category name"
              className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1"
            />
            {addError && <p className="text-xs text-red-500">{addError}</p>}
          </div>
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="px-4 py-2 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] rounded hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
          >
            {adding ? "Adding…" : "Add category"}
          </button>
        </form>
      </div>

      {/* Categories table */}
      {categories.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-lg py-16 text-center">
          <p className="text-[var(--color-muted)] text-sm">No categories yet. Add one above.</p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Posts</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                >
                  {/* Name cell — normal or edit mode */}
                  <td className="px-4 py-3">
                    {editingId === cat.id ? (
                      <div className="flex flex-col gap-1">
                        <input
                          value={editName}
                          onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(cat.id); if (e.key === "Escape") setEditingId(null); }}
                          autoFocus
                          className="px-2 py-1 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-1 w-full max-w-[240px]"
                        />
                        {editError && <p className="text-xs text-red-500">{editError}</p>}
                      </div>
                    ) : (
                      <span className="font-medium">{cat.name}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[var(--color-muted)] font-mono text-xs hidden sm:table-cell">
                    {cat.slug}
                  </td>

                  <td className="px-4 py-3 text-[var(--color-muted)] hidden sm:table-cell">
                    {cat.postCount}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {editingId === cat.id ? (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={saving}
                          className="text-xs font-medium text-[var(--color-foreground)] underline underline-offset-4 hover:opacity-60 transition-opacity disabled:opacity-40"
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => startEdit(cat)}
                          className="text-xs font-medium underline underline-offset-4 hover:opacity-60 transition-opacity"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(cat.id)}
                          className="text-xs text-[var(--color-muted)] hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {deletingId !== null && (
      <ConfirmModal
        title="Delete category"
        description={`"${categories.find((c) => c.id === deletingId)?.name}" will be permanently deleted. Posts in this category will become uncategorised.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() => handleDelete(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
    )}
    </>
  );
}
