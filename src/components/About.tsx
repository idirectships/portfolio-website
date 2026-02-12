import { about } from '@/data/content';

export default function About() {
  return (
    <section id="about" className="section-container">
      <h2 className="section-title">About</h2>
      <p className="section-subtitle max-w-2xl">{about.summary}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {about.highlights.map((h) => (
          <div key={h.label} className="card text-center">
            <div className="text-3xl font-bold text-accent mb-2">{h.stat}</div>
            <div className="text-sm text-text-secondary">{h.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
