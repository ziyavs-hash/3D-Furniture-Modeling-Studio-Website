import { Box, Layers, Maximize, Camera } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { useI18n } from '@/lib/i18n';

const SERVICES = [
  {
    icon: Box,
    title: '3D Mebel Modelləşdirməsi',
    text: 'Foto, eskiz və ya Pinterest nümunəsindən dəqiq 3D mebel modeli hazırlayıram.',
    tag: '01',
  },
  {
    icon: Layers,
    title: 'Revit Family',
    text: 'Mebel və interyer elementləri üçün istifadəyə hazır Revit Family-ləri hazırlayıram.',
    tag: '02',
  },
  {
    icon: Maximize,
    title: '3ds Max Modelləşdirmə',
    text: 'Peşəkar 3ds Max modelləri, materiallar və detallı geometrik modelləşdirmə.',
    tag: '03',
  },
  {
    icon: Camera,
    title: '3D Render',
    text: 'Modelinizi fotorealistik renderlərə çevirirəm.',
    tag: '04',
  },
];

export default function Services() {
  const { ref, isVisible } = useReveal();
  const { t } = useI18n();

  return (
    <section id="services" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} text-center mb-16`}>
          <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.services.eyebrow}</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3">
            {t.services.title}
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
            {t.services.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className={`reveal reveal-delay-${i + 1} ${isVisible ? 'is-visible' : ''} group relative p-7 rounded-2xl glass hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1`}
            >
              <div className="absolute top-5 right-5 text-xs font-mono text-gray-600 group-hover:text-[#d4af37] transition-colors">
                {s.tag}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 group-hover:from-[#d4af37]/20 group-hover:to-[#d4af37]/5 transition-all duration-500">
                <s.icon className="w-7 h-7 text-[#d4af37]" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-3">{t.services.cards[i].title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t.services.cards[i].text}</p>
              <div className="mt-6 h-px w-0 bg-gradient-to-r from-[#d4af37] to-transparent group-hover:w-full transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
