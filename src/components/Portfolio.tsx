import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { supabase, type PortfolioItem } from '@/lib/supabase';
import { useReveal } from '@/hooks/useReveal';
import { useI18n, optionTranslations, portfolioTitleTranslations } from '@/lib/i18n';

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const { t } = useI18n();
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) updatePos(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (dragging.current && e.touches[0]) updatePos(e.touches[0].clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [updatePos]);

  return (
    <div
      ref={containerRef}
      className="ba-slider w-full aspect-[4/3] rounded-xl overflow-hidden"
      onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
      onTouchStart={(e) => { dragging.current = true; if (e.touches[0]) updatePos(e.touches[0].clientX); }}
    >
      <img src={after} alt={t.portfolio.model} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt={t.portfolio.reference} className="absolute inset-0 h-full object-cover" style={{ width: `${containerRef.current?.clientWidth || 100}%`, maxWidth: 'none' }} />
      </div>
      <div className="ba-handle" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }} />
      <span className="ba-label left-4 glass-strong text-white">{t.portfolio.reference}</span>
      <span className="ba-label right-4 glass-strong text-[#d4af37]">{t.portfolio.model}</span>
    </div>
  );
}

export default function Portfolio() {
  const { ref, isVisible } = useReveal();
  const { language, t } = useI18n();
  const filters = optionTranslations[language].filters;
  const [activeFilter, setActiveFilter] = useState(0);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) setItems(data as PortfolioItem[]);
      setLoading(false);
    };
    fetchPortfolio();
  }, []);

  const filtered = activeFilter === 0 ? items : items.filter((i) => {
    const catIdx = optionTranslations.az.categories.indexOf(i.category);
    return catIdx === activeFilter - 1;
  });

  return (
    <section id="portfolio" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} text-center mb-12`}>
          <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.portfolio.eyebrow}</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3">{t.portfolio.title}</h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {filters.map((f, idx) => (
            <button
              key={f}
              onClick={() => setActiveFilter(idx)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeFilter === idx
                  ? 'bg-[#d4af37] text-[#0a0a0b]'
                  : 'glass text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl glass animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`reveal reveal-delay-${(i % 5) + 1} ${isVisible ? 'is-visible' : ''} group relative aspect-[4/3] rounded-2xl overflow-hidden glass text-left hover:cursor-pointer`}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                {item.before_image_url && item.after_image_url && (
                  <div className="absolute top-4 right-4 glass-strong px-3 py-1.5 rounded-full text-xs font-medium text-[#d4af37]">
                    {t.portfolio.beforeAfter}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white mb-1">{portfolioTitleTranslations[item.title]?.[language] ?? item.title}</h3>
                      <p className="text-sm text-gray-400">{item.software}</p>
                      <span className="inline-block mt-2 text-xs text-[#d4af37] font-medium">{optionTranslations[language].categories[optionTranslations.az.categories.indexOf(item.category)] ?? item.category}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full glass-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fade-in" />
          <div
            className="relative max-w-4xl w-full glass-strong rounded-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full glass-strong flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {selected.before_image_url && selected.after_image_url ? (
              <BeforeAfterSlider before={selected.before_image_url} after={selected.after_image_url} />
            ) : (
              <img src={selected.image_url} alt={selected.title} className="w-full aspect-[4/3] object-cover" />
            )}

            <div className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-white">{selected.title}</h3>
                <p className="text-gray-400 mt-1">{selected.software} · {selected.category}</p>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 rounded-full glass text-sm text-gray-300">{selected.software}</span>
                <span className="px-4 py-2 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-sm font-medium">{selected.category}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
