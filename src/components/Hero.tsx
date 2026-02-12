import { hero } from '@/data/content';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Subtle radial glow behind hero */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl text-center">
        {/* Small label */}
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-line bg-surface-raised text-xs font-mono text-accent tracking-wide uppercase">
          Available for work
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-content mb-6 tracking-tight leading-[1.1]">
          {hero.name}
        </h1>

        <p className="text-lg md:text-xl text-accent font-mono mb-6 tracking-tight">
          {hero.tagline}
        </p>

        <p className="text-content-muted text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
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

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-content-muted">
        <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-content-muted/50 to-transparent" />
      </div>
    </section>
  );
}
