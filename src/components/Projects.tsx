import { projects } from '@/data/content';

export default function Projects() {
  return (
    <section id="projects" className="section-container">
      <h2 className="section-title">Projects</h2>
      <p className="section-subtitle">Things I&apos;m building.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.name} className="card flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">{p.name}</h3>
              {p.status === 'locked' ? (
                <span className="badge text-[10px]">Coming Soon</span>
              ) : (
                <span className="badge text-[10px] border-accent/40 text-accent">Open</span>
              )}
            </div>

            <p className="text-sm text-accent font-mono mb-2">{p.tagline}</p>
            <p className="text-sm text-text-secondary mb-4 flex-1">{p.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {p.tech.map((t) => (
                <span key={t} className="badge">
                  {t}
                </span>
              ))}
            </div>

            {(p.github || p.live) && (
              <div className="flex gap-3 mt-auto pt-2 border-t border-border">
                {p.github && (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-secondary hover:text-accent transition-colors"
                  >
                    GitHub &rarr;
                  </a>
                )}
                {p.live && (
                  <a
                    href={p.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-secondary hover:text-accent transition-colors"
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
