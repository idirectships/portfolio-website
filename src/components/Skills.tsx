import { skillGroups, certifications } from '@/data/content';

export default function Skills() {
  return (
    <section id="skills" className="section-container">
      <h2 className="section-title">Tech Stack</h2>
      <p className="section-subtitle">Tools and technologies I work with.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {skillGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-xs font-mono text-accent mb-4 tracking-wider uppercase">
              {group.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 text-sm font-mono rounded-lg bg-surface-raised text-content-muted border border-line transition-colors duration-200 hover:border-accent/40 hover:text-content"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div className="mt-14 pt-8 border-t border-line/60">
        <h3 className="text-xs font-mono text-accent mb-4 tracking-wider uppercase">
          Certifications
        </h3>
        <div className="flex flex-wrap gap-3">
          {certifications.map((cert) => (
            <span
              key={cert}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-accent/5 text-content border border-accent/20"
            >
              {cert}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
