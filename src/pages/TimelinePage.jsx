import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import CanvasTimeline from '../components/CanvasTimeline';
import { events, sources, SRC_COLORS, SRC_NAMES, EVENT_TYPE_LABELS } from '../data/db';

export default function TimelinePage() {
  const { t } = useTranslation();
  const [srcFilter, setSrcFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allTypes = useMemo(() => {
    const tMap = {};
    events.forEach(e => { if (e.t) tMap[e.t] = (tMap[e.t] || 0) + 1; });
    return Object.entries(tMap).sort((a, b) => b[1] - a[1]);
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (e.y === null) return false;
      if (srcFilter !== 'all' && e.s !== srcFilter) return false;
      if (typeFilter !== 'all' && e.t !== typeFilter) return false;
      return true;
    });
  }, [srcFilter, typeFilter]);

  // Distribution bar data
  const decades = useMemo(() => {
    const d = {};
    filtered.forEach(e => {
      const dec = Math.floor(e.y / 10) * 10;
      d[dec] = (d[dec] || 0) + 1;
    });
    return Object.entries(d).sort((a, b) => +a[0] - +b[0]);
  }, [filtered]);
  const maxDecCount = decades.length ? Math.max(...decades.map(([, c]) => c)) : 1;

  return (
    <PageTransition>
      <div className="pt-20 pb-8 bg-geometric min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl text-gold font-light tracking-wide mb-2">{t('timeline.title')}</h1>
            <p className="font-arabic text-gold-dim text-xl">{t('timeline.title_ar')}</p>
            <p className="text-parchment-faint text-sm mt-3 max-w-xl">
              {t('timeline.subtitle', { count: events.length })}
            </p>
            <div className="gold-line w-20 mt-4" />
          </motion.div>

          {/* Filters */}
          <div className="glass-card p-4 mb-6 space-y-3">
            <div>
              <label className="text-gold-dim text-xs uppercase tracking-widest block mb-2">{t('timeline.source_filter')}</label>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setSrcFilter('all')}
                  className={`tag cursor-pointer transition-colors ${srcFilter === 'all' ? 'bg-gold/15 border-gold/30 text-gold' : ''}`}>
                  {t('timeline.all')}
                </button>
                {sources.map(s => (
                  <button key={s.short} onClick={() => setSrcFilter(s.short)}
                    className={`tag cursor-pointer transition-colors ${srcFilter === s.short ? 'bg-gold/15' : ''}`}
                    style={srcFilter === s.short ? { borderColor: s.color, color: s.color } : {}}>
                    {s.full_tr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gold-dim text-xs uppercase tracking-widest block mb-2">{t('timeline.type_filter')}</label>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setTypeFilter('all')}
                  className={`tag cursor-pointer transition-colors ${typeFilter === 'all' ? 'bg-gold/15 border-gold/30 text-gold' : ''}`}>
                  {t('timeline.all')}
                </button>
                {allTypes.slice(0, 10).map(([tp, cnt]) => (
                  <button key={tp} onClick={() => setTypeFilter(tp)}
                    className={`tag cursor-pointer transition-colors ${typeFilter === tp ? 'bg-gold/15 border-gold/30 text-gold' : ''}`}>
                    {EVENT_TYPE_LABELS[tp] || tp} ({cnt})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-parchment-faint text-xs ml-auto">{t('timeline.showing', { count: filtered.length })}</span>
            </div>
          </div>

          {/* Distribution bar */}
          <ScrollReveal>
            <div className="glass-card p-4 mb-6">
              <h3 className="text-gold-dim text-xs uppercase tracking-widest mb-3">{t('timeline.distribution')}</h3>
              <div className="flex items-end gap-px h-20">
                {decades.map(([dec, cnt]) => (
                  <div key={dec} className="flex-1 flex flex-col items-center group" title={`${dec}s: ${cnt}`}>
                    <span className="text-[0.5rem] text-parchment-faint opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">{cnt}</span>
                    <div className="w-full rounded-t group-hover:opacity-100 transition-opacity"
                      style={{
                        height: `${Math.max(4, (cnt / maxDecCount) * 100)}%`,
                        background: srcFilter !== 'all' ? SRC_COLORS[srcFilter] : `linear-gradient(to top, rgba(212,168,72,0.4), rgba(212,168,72,0.7))`,
                        opacity: 0.6,
                      }} />
                  </div>
                ))}
              </div>
              {decades.length > 0 && (
                <div className="flex justify-between mt-1 text-[0.55rem] text-parchment-faint">
                  <span>{decades[0]?.[0]}s</span>
                  <span>{decades[decades.length - 1]?.[0]}s</span>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Canvas Interactive Timeline — NEW */}
          <ScrollReveal>
            <div className="mb-6">
              <CanvasTimeline events={events} sources={sources} filters={{ source: srcFilter, type: typeFilter }} />
              <p className="text-parchment-faint text-[0.65rem] mt-2 italic">{t('timeline.zoom_hint')}</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
