import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import EventNetwork from '../components/EventNetwork';
import { sources, events, SRC_COLORS, EVENT_TYPE_LABELS, OUTCOME_LABELS } from '../data/db';

export default function SourceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const source = sources.find(s => s.id === id);

  if (!source) {
    return (
      <PageTransition>
        <div className="pt-24 text-center">
          <h1 className="text-gold text-2xl">{t('source_detail.not_found')}</h1>
          <Link to="/sources" className="text-gold-dim text-sm mt-4 inline-block hover:text-gold">← {t('source_detail.back')}</Link>
        </div>
      </PageTransition>
    );
  }

  const srcEvents = events.filter(e => e.s === source.short);
  const typeCount = {};
  srcEvents.forEach(e => { typeCount[e.t] = (typeCount[e.t] || 0) + 1; });
  const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
  const outcomeCount = {};
  srcEvents.forEach(e => { if (e.u && e.u !== 'not_applicable') outcomeCount[e.u] = (outcomeCount[e.u] || 0) + 1; });

  const decades = {};
  srcEvents.forEach(e => {
    const dec = Math.floor(e.y / 10) * 10;
    decades[dec] = (decades[dec] || 0) + 1;
  });
  const maxDec = Math.max(...Object.values(decades));

  return (
    <PageTransition>
      <div className="pt-20 pb-8 bg-geometric min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/sources" className="inline-flex items-center gap-1.5 text-parchment-faint text-sm hover:text-gold transition-colors mb-6">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {t('source_detail.back')}
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl text-gold font-light">{source.full_tr}</h1>
                <p className="text-parchment-faint text-sm mt-1">{source.full_en}</p>
                <p className="text-parchment-dim italic mt-2">{source.work_tr} · {source.work_en}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-arabic text-gold text-4xl leading-tight">{source.name_ar}</div>
                <div className="font-arabic text-gold-dim text-lg mt-1" dir="rtl">{source.work_ar}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="tag font-semibold text-sm" style={{ borderColor: source.color, color: source.color }}>{source.record_count} {t('source_detail.records')}</span>
              <span className="tag text-sm">{source.period}</span>
              <span className="tag text-sm">{source.perspective.replace(/_/g, ' ')}</span>
            </div>
            <div className="h-1 rounded-full mt-4 w-full max-w-xs" style={{ background: source.color, opacity: 0.5 }} />
          </motion.div>

          {/* Timeline (decades) */}
          <ScrollReveal>
            <h2 className="text-lg text-gold-dim font-medium mb-4">{t('source_detail.time_dist')}</h2>
            <div className="glass-card p-5 mb-8">
              <div className="flex items-end gap-1 h-32">
                {Object.entries(decades).sort((a,b) => +a[0] - +b[0]).map(([dec, cnt]) => (
                  <div key={dec} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[0.6rem] text-parchment-faint opacity-0 group-hover:opacity-100 transition-opacity">{cnt}</span>
                    <div className="w-full rounded-t transition-all duration-300 group-hover:opacity-100"
                      style={{ height: `${(cnt / maxDec) * 100}%`, background: source.color, opacity: 0.6, minHeight: '4px' }} />
                    <span className="text-[0.55rem] text-parchment-faint -rotate-45 origin-top-left whitespace-nowrap">{dec}s</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* D3 Network Graph — NEW */}
          <ScrollReveal>
            <h2 className="text-lg text-gold-dim font-medium mb-4">{t('source_detail.network_title')}</h2>
            <div className="mb-8">
              <EventNetwork events={srcEvents} sourceColor={source.color} sourceName={source.full_tr} />
              <p className="text-parchment-faint text-[0.65rem] mt-2 italic">Sürükle, yakınlaştır/uzaklaştır. Büyük düğümler konumları, küçükler olayları temsil eder.</p>
            </div>
          </ScrollReveal>

          {/* Stats grid */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <ScrollReveal delay={0.1}>
              <div className="glass-card p-5">
                <h3 className="text-gold-dim text-xs uppercase tracking-widest mb-3">{t('source_detail.event_types')}</h3>
                <div className="space-y-2">
                  {sortedTypes.map(([type, cnt]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-parchment-faint text-xs flex-shrink-0 w-28 text-right">{EVENT_TYPE_LABELS[type] || type}</span>
                      <div className="flex-1 h-2 bg-ink-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(cnt / srcEvents.length) * 100}%`, background: source.color, opacity: 0.6 }} />
                      </div>
                      <span className="text-parchment-faint text-xs w-6 text-right">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <div className="glass-card p-5">
                <h3 className="text-gold-dim text-xs uppercase tracking-widest mb-3">{t('source_detail.outcomes')}</h3>
                {Object.keys(outcomeCount).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(outcomeCount).sort((a,b) => b[1] - a[1]).map(([out, cnt]) => (
                      <div key={out} className="flex items-center gap-2">
                        <span className="text-parchment-faint text-xs flex-shrink-0 w-28 text-right">{OUTCOME_LABELS[out] || out}</span>
                        <div className="flex-1 h-2 bg-ink-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gold/50" style={{ width: `${(cnt / srcEvents.length) * 100}%` }} />
                        </div>
                        <span className="text-parchment-faint text-xs w-6 text-right">{cnt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-parchment-faint text-sm">{t('source_detail.no_outcome')}</p>
                )}

                <h3 className="text-gold-dim text-xs uppercase tracking-widest mb-3 mt-6">{t('source_detail.geo_dist')}</h3>
                <div className="space-y-1.5">
                  {(() => {
                    const locs = {};
                    srcEvents.forEach(e => { locs[e.l] = (locs[e.l] || 0) + 1; });
                    return Object.entries(locs).sort((a,b) => b[1] - a[1]).slice(0, 8).map(([loc, cnt]) => (
                      <div key={loc} className="flex justify-between text-xs">
                        <span className="text-parchment-dim">{loc}</span>
                        <span className="text-parchment-faint">{cnt}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Events list */}
          <ScrollReveal delay={0.2}>
            <h2 className="text-lg text-gold-dim font-medium mb-4">{t('source_detail.events')} ({srcEvents.length})</h2>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2">
              {srcEvents.sort((a, b) => a.y - b.y).map(ev => (
                <div key={ev.n + ev.y} className="glass-card p-3 flex items-center gap-3 group cursor-default hover:border-gold/20">
                  <span className="text-gold text-xs font-semibold w-10 text-right flex-shrink-0">{ev.y}</span>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: source.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-parchment-dim text-sm truncate">{ev.n}</div>
                    {ev.r && <div className="font-arabic text-parchment-faint text-xs truncate mt-0.5" dir="rtl">{ev.r}</div>}
                  </div>
                  <span className="tag text-[0.65rem] flex-shrink-0">{EVENT_TYPE_LABELS[ev.t] || ev.t}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
