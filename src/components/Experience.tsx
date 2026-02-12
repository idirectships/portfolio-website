import { experience, education } from '@/data/content';

export default function Experience() {
  return (
    <section id="experience" className="section-container">
      <h2 className="section-title">Experience</h2>
      <p className="section-subtitle">Where I&apos;ve been and what I&apos;ve done.</p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[5px] md:left-[21px] top-2 bottom-0 w-px bg-gradient-to-b from-accent/40 via-line to-transparent" />

        <div className="space-y-12 pl-8 md:pl-14">
          {experience.map((role, i) => (
            <div key={i} className="relative group">
              {/* Dot */}
              <div className="absolute -left-8 md:-left-14 top-1.5 w-3 h-3 rounded-full bg-accent border-[3px] border-surface transition-shadow duration-300 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.4)]" />

              <div className="text-xs font-mono text-accent/80 mb-1.5 tracking-wide">
                {role.period}
              </div>
              <h3 className="text-xl font-semibold text-content mb-0.5">{role.title}</h3>
              <div className="text-sm text-content-muted font-mono mb-3">{role.company}</div>
              <p className="text-sm text-content-muted leading-relaxed mb-4">
                {role.description}
              </p>

              <ul className="space-y-2">
                {role.highlights.map((h, j) => (
                  <li
                    key={j}
                    className="text-sm text-content-muted flex items-start gap-2.5"
                  >
                    <span className="text-accent/60 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-accent/60" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="mt-16 pt-8 border-t border-line/60">
        <div className="text-xs font-mono text-accent/80 mb-2 tracking-wide uppercase">
          Education
        </div>
        <div className="text-lg text-content font-semibold">{education.degree}</div>
        <div className="text-sm text-content-muted">{education.school}</div>
      </div>
    </section>
  );
}
