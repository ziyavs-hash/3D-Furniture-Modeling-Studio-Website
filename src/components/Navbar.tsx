import { useEffect, useState } from 'react';
import { Menu, X, Box } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';
import { LANGUAGES, useI18n } from '@/lib/i18n';

const NAV_LINKS = [
  { key: 'home', href: '#hero' },
  { key: 'services', href: '#services' },
  { key: 'portfolio', href: '#portfolio' },
  { key: 'pricing', href: '#pricing' },
  { key: 'about', href: '#about' },
  { key: 'contact', href: '#contact' },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass-strong py-3' : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('#hero')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8941f] flex items-center justify-center transition-transform group-hover:scale-110">
              <Box className="w-5 h-5 text-[#0a0a0b]" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight hidden sm:block">
              {BRAND_NAME}
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-300 relative group"
              >
                {t.nav[link.key]}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#d4af37] transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1 rounded-full glass px-2 py-1">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  aria-label={item.name}
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-colors ${language === item.code ? 'bg-[#d4af37] text-[#0a0a0b]' : 'text-gray-400 hover:text-white'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleNavClick('#order')}
              className="hidden sm:flex items-center px-5 py-2.5 rounded-full bg-[#d4af37] text-[#0a0a0b] text-sm font-semibold hover:bg-[#e0bd4a] transition-all duration-300 hover:scale-105"
            >
              {t.nav.order}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 text-white"
              aria-label={t.nav.menu}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#0d0d0e] border-l border-white/5 p-6 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display font-bold text-white">{t.nav.menu}</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setLanguage(item.code)}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${language === item.code ? 'bg-[#d4af37] text-[#0a0a0b]' : 'glass text-gray-400 hover:text-white'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-base font-medium"
                >
                  {t.nav[link.key]}
                </button>
              ))}
              <button
                onClick={() => handleNavClick('#order')}
                className="mt-4 px-5 py-3.5 rounded-xl bg-[#d4af37] text-[#0a0a0b] text-base font-semibold text-center"
              >
                {t.nav.order}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
