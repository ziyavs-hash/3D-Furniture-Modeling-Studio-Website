import { Upload, PenTool, Package } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { useI18n } from '@/lib/i18n';

const STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Şəkli göndər',
    text: 'Mebelinizin fotosunu, Pinterest linkini və ya eskizini göndərin.',
  },
  {
    num: '02',
    icon: PenTool,
    title: 'Model hazırlansın',
    text: 'Mən nümunəni analiz edib 3D modelini hazırlayıram.',
  },
  {
    num: '03',
    icon: Package,
    title: 'Hazır modeli əldə et',
    text: 'Final model, Revit Family və ya render fayllarını əldə edin.',
  },
];

export default function HowItWorks() {
  const { ref, isVisible } = useReveal();
  const { t } = useI18n();

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-[#d4af37]/[0.03] blur-[100px]" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} text-center mb-20`}>
          <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.process.eyebrow}</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3">
            {t.process.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`reveal reveal-delay-${i + 1} ${isVisible ? 'is-visible' : ''} relative text-center`}
            >
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="w-32 h-32 rounded-full glass flex items-center justify-center relative z-10 group hover:bg-white/[0.06] transition-all duration-500">
                  <step.icon className="w-10 h-10 text-[#d4af37] group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-2 -right-2 text-5xl font-display font-bold text-white/5 z-0 select-none">
                  {step.num}
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold text-white mb-3">{t.process.steps[i].title}</h3>
              <p className="text-gray-400 max-w-xs mx-auto leading-relaxed">{t.process.steps[i].text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
