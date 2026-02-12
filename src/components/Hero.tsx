import { hero } from '@/data/content';

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-content mb-4 tracking-tight">
          {hero.name}
        </h1>
        <p className="text-lg md:text-xl text-accent font-mono mb-6">{hero.tagline}</p>
        <p className="text-content-muted text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          {hero.oneLiner}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href={hero.cta.primary.href} className="btn-primary">
            {hero.cta.primary.label}
          </a>
          <a href={hero.cta.secondary.href} className="btn-outline">
            {hero.cta.secondary.label}
          </a>
        </div>
      </div>
    </section>
  );
}
