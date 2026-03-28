import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CommandPalette from './CommandPalette';
import LanguageSwitcher from './LanguageSwitcher';

const linkKeys = [
  { to: '/', key: 'nav.home' },
  { to: '/map', key: 'nav.map' },
  { to: '/sources', key: 'nav.sources' },
  { to: '/castles', key: 'nav.castles' },
  { to: '/routes', key: 'nav.routes' },
  { to: '/compare', key: 'nav.compare' },
  { to: '/timeline', key: 'nav.timeline' },
  { to: '/about', key: 'nav.about' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-[1000] h-14 flex items-center justify-between px-5 transition-all duration-500 ${
      scrolled
        ? 'bg-ink-100/95 backdrop-blur-xl border-b border-gold/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
        : 'bg-transparent border-b border-transparent'
    }`}>
      <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setMenuOpen(false)}>
        <span className="text-gold/50 text-xs group-hover:text-gold/80 transition-colors duration-500">☪</span>
        <span className="font-arabic text-gold text-lg tracking-wide group-hover:text-glow transition-all duration-500">الحروب الصليبية</span>
      </Link>

      <div className="hidden lg:flex items-center gap-5">
        {linkKeys.map(l => (
          <Link key={l.to} to={l.to}
            className={`relative text-[0.8rem] font-medium tracking-wide transition-all duration-300 py-1 ${
              pathname === l.to ? 'text-gold' : 'text-parchment-faint hover:text-parchment-dim'
            }`}>
            {t(l.key)}
            {pathname === l.to && (
              <motion.div layoutId="nav-active"
                className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #d4a848, transparent)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <LanguageSwitcher />
        <CommandPalette />
        <button className="lg:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <motion.span className="block w-5 h-[1.5px] bg-parchment-dim origin-center"
            animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} />
          <motion.span className="block w-5 h-[1.5px] bg-parchment-dim"
            animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} />
          <motion.span className="block w-5 h-[1.5px] bg-parchment-dim origin-center"
            animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-14 left-0 right-0 bg-ink-100/98 backdrop-blur-2xl border-b border-gold/10 lg:hidden overflow-hidden">
            <div className="flex flex-col p-3">
              {linkKeys.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}>
                  <Link to={l.to} onClick={() => setMenuOpen(false)}
                    className={`block py-2.5 px-4 rounded-lg text-sm transition-all duration-300 ${
                      pathname === l.to ? 'text-gold bg-gold/5' : 'text-parchment-dim hover:text-parchment hover:bg-gold/5'
                    }`}>{t(l.key)}</Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
