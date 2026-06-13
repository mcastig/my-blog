"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Category = { id: number; name: string; slug: string };

export function CategoryDropdown({ cats }: { cats: Category[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (cats.length === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
      >
        Categories
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-lg z-50 overflow-hidden">
          <ul>
            {cats.map((cat) => (
              <li key={cat.id} className="border-b border-[var(--color-border)] last:border-0">
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm hover:bg-[var(--color-surface)] transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
