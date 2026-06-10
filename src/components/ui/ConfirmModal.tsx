"use client";

type Props = {
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold tracking-tight text-left">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-[var(--color-muted)] text-left break-words">{description}</p>
        )}
        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="py-2 px-4 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="py-2 px-4 bg-red-500 text-white text-sm font-medium rounded hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
