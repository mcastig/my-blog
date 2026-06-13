import Link from "next/link";
import { ThemeToggle } from "@/components/blog/ThemeToggle/ThemeToggle";
import { SearchBar } from "@/components/blog/SearchBar/SearchBar";
import { MobileMenu } from "@/components/blog/MobileMenu/MobileMenu";
import { CategoryDropdown } from "@/components/blog/CategoryDropdown/CategoryDropdown";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export async function Header() {
  const cats = await db.select().from(categories);

  return (
    <header className="border-b border-[var(--color-border)] sticky top-0 z-50 bg-[var(--color-background)]/95">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl tracking-tight hover:opacity-70 transition-opacity"
        >
          My Blog
        </Link>

        <nav className="flex items-center gap-3">
          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <CategoryDropdown cats={cats} />
            <SearchBar />
          </div>
          <ThemeToggle />

          {/* Mobile hamburger */}
          <MobileMenu cats={cats} />
        </nav>
      </div>
    </header>
  );
}
