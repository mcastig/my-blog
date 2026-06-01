"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/blog/SearchBar/SearchBar";

type Category = { id: number; name: string; slug: string };

export function MobileMenu({ cats }: { cats: Category[] }) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();

  // Track .dark class on <html>
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const fg = isDark ? "#ffffff" : "#0a0a0a";
  const bg = isDark ? "#0a0a0a" : "#ffffff";

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="sm:hidden w-8 h-8 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
      >
        {open ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="sm:hidden fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col items-center border-t"
          style={{ backgroundColor: bg, color: fg, borderColor: fg + "20" }}
        >
          <div className="w-full px-6 py-8 flex flex-col items-center gap-8">
            <SearchBar />

            {cats.length > 0 && (
              <nav className="flex flex-col items-center gap-1 w-full text-center">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-3">
                  Categories
                </p>
                {cats.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    style={{ color: fg }}
                    className="py-2 text-lg font-medium opacity-90 hover:opacity-60 transition-opacity"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      )}
    </>
  );
}
