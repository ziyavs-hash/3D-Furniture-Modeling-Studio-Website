import { useReveal } from '@/hooks/useReveal';
import { useParallax } from '@/hooks/useParallax';
import { useI18n } from '@/lib/i18n';

const PORTRAIT_IMAGE = 'https://images.pexels.com/photos/9618125/pexels-photo-9618125.jpeg?auto=compress&cs=tinysrgb&w=800';

export default function About() {
  const { ref, isVisible } = useReveal();
  const { ref: imgRef, offset } = useParallax<HTMLDivElement>(0.1);
  const { t } = useI18n();

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="about" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#d4af37]/[0.03] blur-[100px]" />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 relative">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} grid lg:grid-cols-5 gap-12 lg:gap-16 items-center`}>
          {/* Portrait */}
          <div ref={imgRef} className="lg:col-span-2 relative" style={{ transform: `translateY(${offset}px)` }}>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden glass">
              <img
                src={PORTRAIT_IMAGE}
                alt={t.about.imageAlt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b]/40 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-4 glass-strong px-5 py-4 rounded-xl hidden sm:block">
              <p className="text-xs text-gray-400">{t.about.experience}</p>
              <p className="font-display text-2xl font-bold gradient-gold">5+ il</p>
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-3 space-y-6">
            <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.about.eyebrow}</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white leading-tight">
              {t.about.title}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              {t.about.text}
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 rounded-xl glass">
                <p className="font-display text-2xl font-bold text-white">200+</p>
                <p className="text-xs text-gray-500 mt-1">{t.about.stats[0]}</p>
              </div>
              <div className="text-center p-4 rounded-xl glass">
                <p className="font-display text-2xl font-bold text-white">50+</p>
                <p className="text-xs text-gray-500 mt-1">{t.about.stats[1]}</p>
              </div>
              <div className="text-center p-4 rounded-xl glass">
                <p className="font-display text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-gray-500 mt-1">{t.about.stats[2]}</p>
              </div>
            </div>

            <button
              onClick={() => scrollTo('#contact')}
              className="px-7 py-3.5 rounded-full bg-[#d4af37] text-[#0a0a0b] font-semibold text-sm hover:bg-[#e0bd4a] transition-all duration-300 hover:scale-105"
            >
              {t.about.button}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
