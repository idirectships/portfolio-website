import { about } from '@/data/content';

export default function About() {
  return (
    <section id="about" className="section-container">
      <h2 className="section-title">About</h2>
      <p className="section-subtitle max-w-2xl">{about.summary}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {about.highlights.map((h) => (
          <div
            key={h.label}
            className="group relative bg-surface-raised border border-line rounded-2xl p-6 text-center transition-all duration-300 hover:border-accent/40 hover:-translate-y-0.5"
          >
            {/* Subtle top accent line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="text-4xl md:text-5xl font-bold text-accent mb-3 tracking-tight">
              {h.stat}
            </div>
            <div className="text-sm text-content-muted leading-snug">{h.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
