import { experience, education } from '@/data/content';

export default function Experience() {
  return (
    <section id="experience" className="section-container">
      <h2 className="section-title">Experience</h2>
      <p className="section-subtitle">Where I&apos;ve been and what I&apos;ve done.</p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-0 md:left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-10 pl-8 md:pl-14">
          {experience.map((role, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div className="absolute -left-8 md:-left-14 top-1.5 w-3 h-3 rounded-full bg-accent border-2 border-bg-primary" />

              <div className="text-sm font-mono text-accent mb-1">{role.period}</div>
              <h3 className="text-lg font-semibold text-text-primary">{role.title}</h3>
              <div className="text-sm text-text-secondary mb-2">{role.company}</div>
              <p className="text-sm text-text-secondary mb-3">{role.description}</p>

              <ul className="space-y-1">
                {role.highlights.map((h, j) => (
                  <li key={j} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="text-accent mt-1 shrink-0">&#8226;</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <div className="text-sm font-mono text-accent mb-1">Education</div>
        <div className="text-text-primary font-semibold">{education.degree}</div>
        <div className="text-sm text-text-secondary">{education.school}</div>
      </div>
    </section>
  );
}
