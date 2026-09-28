import { Check, ArrowRight } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { useI18n } from '@/lib/i18n';

const PACKAGES = [
  {
    name: 'START',
    price: '20 AZN-dən',
    features: [
      'Sadə 3D obyektlər',
      'Stol',
      'Stul',
      'Dekorativ obyektlər',
      '1 əsas düzəliş',
    ],
    highlight: false,
  },
  {
    name: 'PRO',
    price: '40 AZN-dən',
    features: [
      'Orta mürəkkəblikdə mebel',
      'Kreslo',
      'Divan',
      'Komod',
      'Daha detallı modelləşdirmə',
      '2 düzəliş',
    ],
    highlight: true,
  },
  {
    name: 'PREMIUM',
    price: '70 AZN-dən',
    features: [
      'Mürəkkəb mebel',
      'Premium divan',
      'Kompleks kreslo',
      'Detallı modelləşdirmə',
      'Materiallar',
      'Revit Family və ya render',
    ],
    highlight: false,
  },
];

const ADDONS = [
  { label: 'Revit Family', price: '40 AZN-dən' },
  { label: '3D Render', price: '20 AZN-dən' },
  { label: 'Model + Render', price: '60 AZN-dən' },
];

export default function Pricing() {
  const { ref, isVisible } = useReveal();
  const { t } = useI18n();

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} text-center mb-16`}>
          <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.pricing.eyebrow}</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3">
            {t.pricing.title}
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {PACKAGES.map((pkg, i) => (
            <div
              key={pkg.name}
              className={`reveal reveal-delay-${i + 1} ${isVisible ? 'is-visible' : ''} relative p-8 rounded-2xl transition-all duration-500 ${
                pkg.highlight
                  ? 'glass-strong border-[#d4af37]/30 hover:-translate-y-1.5 glow-gold'
                  : 'glass hover:bg-white/[0.06] hover:-translate-y-1'
              }`}
            >
              {pkg.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#d4af37] text-[#0a0a0b] text-xs font-bold tracking-wide">
                  {t.pricing.popular}
                </div>
              )}
              <h3 className="font-display text-sm font-bold tracking-widest text-gray-400 mb-4">
                {t.pricing.packages[i].name}
              </h3>
              <p className={`font-display text-4xl font-bold mb-6 ${pkg.highlight ? 'gradient-gold' : 'text-white'}`}>
                {t.pricing.packages[i].price}
              </p>
              <ul className="space-y-3.5 mb-8">
                {t.pricing.packages[i].features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className={`w-4 h-4 flex-shrink-0 ${pkg.highlight ? 'text-[#d4af37]' : 'text-gray-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollTo('#order')}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                pkg.highlight
                    ? 'bg-[#d4af37] text-[#0a0a0b] hover:bg-[#e0bd4a] hover:scale-[1.02]'
                    : 'glass text-white hover:bg-white/10'
              }`}
              >
                {t.pricing.order}
                <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className={`reveal ${isVisible ? 'is-visible' : ''} glass rounded-2xl p-6 sm:p-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-display text-lg font-semibold text-white">{t.pricing.addons}</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {t.pricing.addonItems.map((a) => (
              <div key={a.label} className="flex items-center justify-between px-5 py-4 rounded-xl bg-white/5">
                <span className="text-sm font-medium text-gray-300">{a.label}</span>
                <span className="text-sm font-bold text-[#d4af37]">{a.price}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            {t.pricing.note}
          </p>
        </div>
      </div>
    </section>
  );
}
