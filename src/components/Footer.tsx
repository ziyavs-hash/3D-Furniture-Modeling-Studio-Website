import { Box, Instagram, MessageCircle } from 'lucide-react';
import { BRAND_NAME, WHATSAPP_LINK, INSTAGRAM_LINK } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';

const LINKS = [
  { key: 'home', href: '#hero' },
  { key: 'services', href: '#services' },
  { key: 'portfolio', href: '#portfolio' },
  { key: 'pricing', href: '#pricing' },
  { key: 'faq', href: '#faq' },
  { key: 'contact', href: '#contact' },
] as const;

export default function Footer() {
  const { t } = useI18n();
  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/5 py-14 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8941f] flex items-center justify-center">
                <Box className="w-5 h-5 text-[#0a0a0b]" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-lg text-white">{BRAND_NAME}</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t.footer.tagline}
            </p>
          </div>

          {/* Links */}
          <div className="md:text-center">
            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">{t.footer.navigation}</h4>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {LINKS.map((l) => (
                <button
                  key={l.href}
                  onClick={() => scrollTo(l.href)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t.nav[l.key]}
                </button>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="md:text-right">
            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">{t.footer.social}</h4>
            <div className="flex md:justify-end gap-3">
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors group"
              >
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors group"
              >
                <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{t.footer.rights}</p>
          <p className="text-xs text-gray-600">{t.footer.location}</p>
        </div>
      </div>
    </footer>
  );
}
