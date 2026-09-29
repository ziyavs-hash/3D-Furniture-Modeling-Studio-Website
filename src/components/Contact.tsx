import { MessageCircle, Instagram, Mail, ArrowRight } from 'lucide-react';
import { WHATSAPP_LINK, WHATSAPP_DEFAULT_MESSAGE, INSTAGRAM_LINK, EMAIL } from '@/lib/constants';
import { useReveal } from '@/hooks/useReveal';
import { useI18n } from '@/lib/i18n';

export default function Contact() {
  const { ref, isVisible } = useReveal();
  const { t } = useI18n();

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="contact" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#d4af37]/[0.04] blur-[130px]" />
      <div className="max-w-5xl mx-auto px-5 sm:px-8 relative">
        <div ref={ref} className={`reveal ${isVisible ? 'is-visible' : ''} text-center mb-14`}>
          <span className="text-sm font-medium text-[#d4af37] tracking-widest uppercase">{t.contact.eyebrow}</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mt-3">
            {t.contact.title}
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto text-lg">
            {t.contact.subtitle}
          </p>
        </div>

        <div className={`reveal reveal-delay-1 ${isVisible ? 'is-visible' : ''} grid sm:grid-cols-3 gap-4 mb-12`}>
          <a
            href={`${WHATSAPP_LINK}?text=${WHATSAPP_DEFAULT_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-7 rounded-2xl glass hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7 text-[#25D366]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-1">{t.contact.whatsapp}</h3>
            <p className="text-sm text-gray-400">{t.contact.whatsappText}</p>
          </a>

          <a
            href={INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-7 rounded-2xl glass hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Instagram className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-1">{t.contact.instagram}</h3>
            <p className="text-sm text-gray-400">{t.contact.instagramText}</p>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="group p-7 rounded-2xl glass hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-7 h-7 text-[#d4af37]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-1">{t.contact.email}</h3>
            <p className="text-sm text-gray-400">{EMAIL}</p>
          </a>
        </div>

        {/* Big CTA */}
        <div className={`reveal reveal-delay-2 ${isVisible ? 'is-visible' : ''} relative glass-strong rounded-3xl p-10 sm:p-14 text-center overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/[0.05] via-transparent to-transparent" />
          <div className="relative">
            <h3 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
              {t.contact.ctaTitle}
            </h3>
            <p className="text-gray-400 max-w-lg mx-auto mb-8 text-lg">
              {t.contact.ctaText}
            </p>
            <button
              onClick={() => scrollTo('#order')}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#d4af37] text-[#0a0a0b] font-semibold text-base hover:bg-[#e0bd4a] transition-all duration-300 hover:scale-105 animate-pulse-gold"
            >
              {t.contact.ctaButton}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
