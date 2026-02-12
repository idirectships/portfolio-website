export default function Footer() {
  return (
    <footer className="border-t border-line/60 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-content-muted">
        <span>&copy; {new Date().getFullYear()} Andrew Garman</span>
        <span className="font-mono text-xs text-content-muted/60">
          Built with Next.js + Tailwind
        </span>
      </div>
    </footer>
  );
}
