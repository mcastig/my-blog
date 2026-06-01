export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-20">
      <div
        className="max-w-4xl mx-auto px-6 py-8 flex
        flex-col sm:flex-row justify-center items-center
        gap-4 text-md text-[var(--color-muted)] text-center"
      >
        <span>© {new Date().getFullYear()} My Blog</span>
      </div>
    </footer>
  );
}
