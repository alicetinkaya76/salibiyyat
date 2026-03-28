import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const LANGS = [
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('salibiyyat-lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-parchment-faint hover:text-gold border border-gold/10 hover:border-gold/25 rounded-lg transition-all duration-300 bg-ink-100/50 backdrop-blur-sm"
      >
        <span>{current.flag}</span>
        <span className="font-semibold">{current.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 bg-ink-100/95 backdrop-blur-xl border border-gold/15 rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[2000]"
          >
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => switchLang(l.code)}
                className={`flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-colors ${
                  l.code === i18n.language
                    ? 'text-gold bg-gold/8'
                    : 'text-parchment-faint hover:text-parchment-dim hover:bg-gold/5'
                }`}
              >
                <span>{l.flag}</span>
                <span className="font-medium">{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
