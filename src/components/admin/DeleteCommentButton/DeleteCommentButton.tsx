"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function DeleteCommentButton({ id }: { id: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Delete comment"
        className="text-xs text-[var(--color-muted)] hover:text-red-500 transition-colors"
      >
        Delete
      </button>

      {open && (
        <ConfirmModal
          title="Delete comment"
          description="This comment will be permanently deleted. This cannot be undone."
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
