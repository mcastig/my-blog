import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-start pt-50 px-6 text-center">
      <p className="text-6xl font-bold tracking-tight text-[var(--color-muted)]">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="mt-8 px-5 py-2.5 bg-[var(--color-foreground)] text-[var(--color-background)] 
          text-sm font-medium rounded hover:opacity-80 transition-opacity"
      >
        Go home
      </Link>
    </div>
  );
}
