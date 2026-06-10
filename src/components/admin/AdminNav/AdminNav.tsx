"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/blog/ThemeToggle/ThemeToggle";
import { ProfileMenu } from "@/components/admin/ProfileMenu/ProfileMenu";

export function AdminNav({ username, firstName, lastName }: { username: string; firstName: string | null; lastName: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/admin/login") return null;

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/comments", label: "Comments" },
    { href: "/admin/posts/new", label: "New Post" },
  ];

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main bar */}
        <div className="h-14 flex items-center">
          <Link href="/" className="text-sm font-bold tracking-tight shrink-0">
            ← Blog
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-1 ml-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  pathname === link.href
                    ? "bg-[var(--color-surface)] font-medium"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ProfileMenu username={username} firstName={firstName} lastName={lastName} />
            <ThemeToggle />

            {/* Hamburger button — mobile only */}
            <button
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded hover:bg-[var(--color-surface)] transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <nav className="sm:hidden border-t border-[var(--color-border)] py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm rounded transition-colors ${
                  pathname === link.href
                    ? "bg-[var(--color-surface)] font-medium"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
