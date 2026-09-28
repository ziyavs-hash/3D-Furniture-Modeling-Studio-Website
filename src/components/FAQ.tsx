import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { useI18n } from '@/lib/i18n';

export default function FAQ() {
  const { ref, isVisible } = useReveal();
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 lg:py-32 relative">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} text-center mb-12`}>
          <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.faq.eyebrow}</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3">
            {t.faq.title}
          </h2>
        </div>

        <div className={`reveal reveal-delay-1 ${isVisible ? 'is-visible' : ''} space-y-3`}>
          {t.faq.items.map((item, i) => (
            <div
              key={i}
              className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/[0.06]"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-medium text-white text-base">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                    open === i ? 'rotate-180 text-[#d4af37]' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-400 ${
                  open === i ? 'max-h-60' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-5 text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
