import { projects } from '@/data/content';

export default function Projects() {
  return (
    <section id="projects" className="section-container">
      <h2 className="section-title">Projects</h2>
      <p className="section-subtitle">Things I&apos;m building.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.name}
            className="group relative bg-surface-raised border border-line rounded-2xl p-6 flex flex-col transition-all duration-300 hover:border-accent/40 hover:-translate-y-0.5"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.06)' }} />

            <div className="relative flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-content group-hover:text-accent transition-colors duration-200">
                  {p.name}
                </h3>
                <p className="text-sm text-accent/80 font-mono mt-0.5">{p.tagline}</p>
              </div>

              {p.status === 'locked' ? (
                <span className="shrink-0 ml-3 px-2.5 py-1 text-[10px] font-mono rounded-full bg-surface-overlay text-content-muted border border-line">
                  Soon
                </span>
              ) : (
                <span className="shrink-0 ml-3 px-2.5 py-1 text-[10px] font-mono rounded-full border border-accent/40 text-accent bg-accent/5">
                  Open
                </span>
              )}
            </div>

            <p className="text-sm text-content-muted mb-5 flex-1 leading-relaxed">
              {p.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.tech.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-surface-overlay text-content-muted border border-line/60"
                >
                  {t}
                </span>
              ))}
            </div>

            {(p.github || p.live) && (
              <div className="flex gap-4 mt-auto pt-4 border-t border-line/60">
                {p.github && (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-content-muted hover:text-accent transition-colors duration-200 font-mono"
                  >
                    GitHub &rarr;
                  </a>
                )}
                {p.live && (
                  <a
                    href={p.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-content-muted hover:text-accent transition-colors duration-200 font-mono"
                  >
                    Live &rarr;
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
