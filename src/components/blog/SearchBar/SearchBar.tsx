"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

type Result = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  categoryName: string | null;
};

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setShowDropdown(false); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setShowDropdown(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setShowDropdown(false);
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder="Search posts…"
            className="w-40 sm:w-52 pl-8 pr-3 py-1.5 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:w-56 sm:focus:w-64 transition-all"
          />
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <p className="px-4 py-3 text-sm text-[var(--color-muted)]">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--color-muted)]">No results for "{query}"</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                  <Link
                    href={`/${r.slug}`}
                    onClick={() => { setShowDropdown(false); setQuery(""); }}
                    className="block px-4 py-3 hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <p className="text-sm font-medium leading-snug">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.categoryName && (
                        <span className="text-xs text-[var(--color-muted)]">{r.categoryName}</span>
                      )}
                      {r.publishedAt && (
                        <span className="text-xs text-[var(--color-muted)]">
                          {format(new Date(r.publishedAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => { setShowDropdown(false); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }}
                  className="w-full px-4 py-2.5 text-xs text-center text-[var(--color-muted)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  See all results for "{query}" →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
