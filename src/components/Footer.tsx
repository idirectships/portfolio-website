export default function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
        <span>&copy; {new Date().getFullYear()} Andrew Garman</span>
        <span className="font-mono text-xs">Built with Next.js + Tailwind</span>
      </div>
    </footer>
  );
}
