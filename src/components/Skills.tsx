import { skillGroups, certifications } from '@/data/content';

export default function Skills() {
  return (
    <section id="skills" className="section-container">
      <h2 className="section-title">Tech Stack</h2>
      <p className="section-subtitle">Tools and technologies I work with.</p>

      <div className="space-y-8">
        {skillGroups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-mono text-accent mb-3">{group.label}</h3>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item} className="badge">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-mono text-accent mb-3">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => (
              <span key={cert} className="badge border-accent/30 text-content">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
