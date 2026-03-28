import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView as useFramerInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import GoldParticles from '../components/GoldParticles';
import { sources, events, castles, routes, clusters, SRC_COLORS } from '../data/db';

/* ─── Animated counter ─── */
function Counter({ end, suffix = '', label }) {
  const ref = useRef(null);
  const isInView = useFramerInView(ref, { once: true, margin: '-50px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(end / 60));
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setVal(end); clearInterval(t); }
      else setVal(cur);
    }, 22);
    return () => clearInterval(t);
  }, [isInView, end]);

  return (
    <div ref={ref} className="glass-card p-5 sm:p-6 text-center min-w-[85px] group">
      <span className="block text-3xl sm:text-4xl font-bold text-gold tabular-nums leading-none tracking-tight">
        {val.toLocaleString()}{suffix}
      </span>
      <span className="block text-[0.65rem] text-parchment-faint uppercase tracking-[0.15em] mt-2.5 group-hover:text-parchment-dim transition-colors">
        {label}
      </span>
    </div>
  );
}

/* ─── Parallax decorative elements ─── */
function FloatingGlyph({ children, x, y, delay = 0, speed = 0.5 }) {
  const { scrollYProgress } = useScroll();
  const yOffset = useTransform(scrollYProgress, [0, 1], [0, -200 * speed]);
  const springY = useSpring(yOffset, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      className="absolute pointer-events-none select-none font-arabic"
      style={{ left: x, top: y, y: springY }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 2 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Source card ─── */
function SourceCard({ source, index }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const isInView = useFramerInView(ref, { once: true, margin: '-30px' });
  const srcEvents = events.filter(e => e.s === source.short);
  const typeCount = {};
  srcEvents.forEach(e => { typeCount[e.t] = (typeCount[e.t] || 0) + 1; });
  const topTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/sources/${source.id}`} className="glass-card p-5 sm:p-6 block group h-full">
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: source.color }} />
        <div className="absolute top-0 left-0 w-[3px] h-0 group-hover:h-full transition-all duration-700 ease-manuscript" style={{ background: source.color, filter: 'brightness(1.5)' }} />

        <div className="ml-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <h3 className="text-parchment font-semibold text-[1.05rem] group-hover:text-gold transition-colors duration-300">{source.full_tr}</h3>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className="text-xs font-semibold" style={{ color: source.color }}>{source.record_count} {t('landing.records')}</span>
                <span className="text-xs text-parchment-faint">{source.period}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-arabic text-gold-dim text-xl leading-tight group-hover:text-gold transition-colors duration-500">{source.name_ar}</div>
              <div className="font-arabic text-parchment-faint text-sm mt-0.5" dir="rtl">{source.work_ar}</div>
            </div>
          </div>

          {/* Mini distribution */}
          <div className="flex gap-0.5 h-1 rounded-full overflow-hidden mt-3">
            {topTypes.map(([type, cnt]) => (
              <div
                key={type}
                className="h-full rounded-full"
                style={{ width: `${(cnt / srcEvents.length) * 100}%`, background: source.color, opacity: 0.5 + (cnt / srcEvents.length) * 0.5 }}
                title={`${type}: ${cnt}`}
              />
            ))}
            <div className="flex-1 h-full rounded-full bg-ink-200" />
          </div>

          {/* Perspective label */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[0.7rem] text-parchment-faint italic">{source.perspective.replace(/_/g, ' ')}</span>
            <svg className="w-3.5 h-3.5 text-gold-dim opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Main component ─── */
export default function LandingPage() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <PageTransition>
      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-ink-100 bg-arabesque" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(212,168,72,0.07)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(10,9,8,0.9)_0%,transparent_50%)]" />

        {/* Gold particle canvas */}
        <GoldParticles />

        {/* Floating Arabic glyphs */}
        <FloatingGlyph x="8%" y="15%" delay={0.5} speed={0.3}>
          <span className="text-gold/[0.04] text-7xl">ﷲ</span>
        </FloatingGlyph>
        <FloatingGlyph x="85%" y="20%" delay={0.8} speed={0.4}>
          <span className="text-gold/[0.03] text-6xl">☪</span>
        </FloatingGlyph>
        <FloatingGlyph x="12%" y="65%" delay={1.2} speed={0.6}>
          <span className="text-gold/[0.03] text-5xl">⚔</span>
        </FloatingGlyph>
        <FloatingGlyph x="90%" y="60%" delay={1.5} speed={0.5}>
          <span className="text-gold/[0.025] text-5xl">🏰</span>
        </FloatingGlyph>

        {/* Content */}
        <motion.div
          className="relative z-10 px-6"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          {/* Decorative top line */}
          <motion.div
            className="gold-line w-24 mx-auto mb-10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Arabic title */}
          <motion.h1
            className="font-arabic text-gold text-glow-strong leading-tight mb-3"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            الحروب الصليبية
          </motion.h1>

          <motion.p
            className="font-arabic text-gold-dim mb-6"
            style={{ fontSize: 'clamp(1.1rem, 3vw, 2rem)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            من المنظور الإسلامي
          </motion.p>

          {/* TR + EN subtitles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <p className="text-parchment font-light tracking-[0.12em] uppercase mb-1" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.35rem)' }}>
              Müslüman Gözüyle Haçlı Seferleri
            </p>
            <p className="text-parchment-faint font-light tracking-[0.2em] uppercase text-xs sm:text-sm">
              Crusades Through Muslim Eyes
            </p>
          </motion.div>

          {/* Ornate divider */}
          <motion.div
            className="gold-line-ornate w-48 mx-auto my-10"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          />

          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <Counter end={991} label={t('landing.stat_events')} />
            <Counter end={6} label={t('landing.stat_sources')} />
            <Counter end={24} label={t('landing.stat_castles')} />
            <Counter end={11} label={t('landing.stat_routes')} />
            <Counter end={21} label={t('landing.stat_clusters')} />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 justify-center"
          >
            <Link
              to="/map"
              className="group inline-flex items-center gap-2.5 bg-gold text-ink-100 px-7 py-3.5 rounded-lg font-semibold text-[0.95rem] tracking-wide hover:bg-gold-bright transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(212,168,72,0.3)]"
            >
              {t('landing.explore_map')}
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/sources"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gold/20 text-gold-dim text-sm font-medium hover:border-gold/40 hover:text-gold transition-all duration-300"
            >
              {t('landing.explore_sources')}
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            <div className="w-5 h-9 rounded-full border border-gold/15 flex items-start justify-center pt-2">
              <motion.div
                className="w-1 h-1.5 rounded-full bg-gold/30"
                animate={{ opacity: [0.3, 0.8, 0.3], y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SOURCES ═══ */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <ScrollReveal className="section-heading">
          <h2>{t('landing.sources_section')}</h2>
          <p className="ar font-arabic">المصادر الأولية</p>
          <p className="text-parchment-faint text-sm mt-3 max-w-lg mx-auto">
            Altı Müslüman tarihçinin eserlerinden sistematik biçimde dijitalleştirilen tarihî kayıtlar
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((s, i) => <SourceCard key={s.id} source={s} index={i} />)}
        </div>
      </section>

      {/* ═══ FEATURED ═══ */}
      <section className="py-20 px-6 bg-ink-50/30 bg-islamic-stars">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="section-heading">
            <h2>Öne Çıkanlar</h2>
            <p className="ar font-arabic">أبرز المحتويات</p>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🔀', to: '/compare', bg: 'rgba(192,57,43,0.1)', title: 'Kudüs 1187', sub: '4 farklı kaynağın gözünden Hıttin ve Kudüs\'ün fethi' },
              { icon: '🏰', to: '/castles', bg: 'rgba(212,168,72,0.1)', title: 'Krak des Chevaliers', sub: 'Orta Çağ\'ın en etkileyici Haçlı kalesi' },
              { icon: '⚔', to: '/routes', bg: 'rgba(41,128,185,0.1)', title: 'Sefer Güzergâhları', sub: '11 rota, 79 durak — kara ve deniz yolları' },
              { icon: '📖', to: '/sources/usama', bg: 'rgba(46,204,113,0.1)', title: 'Usâme b. Münkız', sub: 'Haçlılarla bizzat yaşamış bir savaşçının anıları' },
            ].map((f, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <Link to={f.to} className="glass-card p-5 block group h-full">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg mb-3 transition-transform duration-300 group-hover:scale-110" style={{ background: f.bg }}>
                    {f.icon}
                  </div>
                  <h4 className="text-parchment font-medium text-sm group-hover:text-gold transition-colors duration-300">{f.title}</h4>
                  <p className="text-parchment-faint text-xs mt-1 leading-relaxed">{f.sub}</p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EXPLORE ═══ */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="gold-line-ornate mb-14" />
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/map', icon: '🗺', label: 'Harita', sub: '790 olay' },
            { to: '/castles', icon: '🏰', label: 'Kaleler', sub: '24 kale' },
            { to: '/routes', icon: '⚔', label: 'Güzergâhlar', sub: '11 rota' },
            { to: '/timeline', icon: '📅', label: 'Zaman Çizelgesi', sub: '370 yıl' },
          ].map((item, i) => (
            <ScrollReveal key={item.to} delay={i * 0.06}>
              <Link to={item.to} className="glass-card p-6 text-center group">
                <div className="text-3xl mb-2 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">{item.icon}</div>
                <div className="text-parchment-dim text-sm font-medium group-hover:text-gold transition-colors">{item.label}</div>
                <div className="text-parchment-faint text-xs mt-0.5">{item.sub}</div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
}
