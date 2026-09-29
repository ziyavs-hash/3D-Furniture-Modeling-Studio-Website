import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, Layers, Camera } from 'lucide-react';
import { useParallax } from '@/hooks/useParallax';
import { useI18n } from '@/lib/i18n';

const HERO_IMAGE = 'https://images.pexels.com/photos/945669/pexels-photo-945669.jpeg?auto=compress&cs=tinysrgb&w=1600';

const FEATURES = [
  { icon: Box, label: '3ds Max' },
  { icon: Layers, label: 'Revit Family' },
  { icon: Camera, label: 'Fotorealistik Render' },
];

export default function Hero() {
  const { ref, offset } = useParallax<HTMLDivElement>(0.15);
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePos({ x: x * 15, y: y * 15 });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" ref={ref} className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-[#0a0a0b] to-[#101012]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#d4af37]/5 blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className={`space-y-7 ${loaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-medium text-gray-400 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              {t.hero.eyebrow}
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-balance">
              <span className="gradient-text">{t.hero.titleA}</span>
              <br />
              <span className="gradient-gold">{t.hero.titleB}</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => scrollTo('#order')}
                className="group flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#d4af37] text-[#0a0a0b] font-semibold text-base hover:bg-[#e0bd4a] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(212,175,55,0.3)]"
              >
                {t.hero.order}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo('#portfolio')}
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-full glass text-white font-medium text-base hover:bg-white/10 transition-all duration-300"
              >
                {t.hero.portfolio}
              </button>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6 pt-6">
              {FEATURES.map((f, i) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2.5"
                  style={{ animation: `fadeInUp 0.6s ${0.3 + i * 0.1}s both` }}
                >
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">{f.label === 'Fotorealistik Render' ? t.hero.featureRender : f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero image with parallax + mouse tilt */}
          <div
            className={`relative ${loaded ? 'animate-scale-in' : 'opacity-0'}`}
            style={{ transform: `translateY(${offset}px)` }}
          >
            <div
              ref={imageRef}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden glass group"
              style={{
                transform: `perspective(1000px) rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.3}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
            >
              <img
                src={HERO_IMAGE}
                alt={t.hero.imageAlt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b]/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                <div className="glass-strong px-4 py-2.5 rounded-xl">
                  <p className="text-xs text-gray-400">{t.hero.latest}</p>
                  <p className="text-sm font-semibold text-white">Minimal Sofa — 3ds Max</p>
                </div>
                <div className="glass-strong px-3 py-2.5 rounded-xl">
                  <span className="text-xs font-mono text-[#d4af37]">.rfa / .max</span>
                </div>
              </div>
            </div>

            {/* Floating accent card */}
            <div className="absolute -top-4 -right-4 glass-strong px-4 py-3 rounded-xl animate-float hidden sm:block">
              <p className="text-xs text-gray-400">{t.hero.quality}</p>
              <p className="text-sm font-bold text-white">4K Photorealistic</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-gray-500">
        <span className="text-xs tracking-widest uppercase">{t.hero.scroll}</span>
        <div className="w-px h-12 bg-gradient-to-b from-gray-600 to-transparent" />
      </div>
    </section>
  );
}
