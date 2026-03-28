import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import { clusters, events, sources, SRC_COLORS, SRC_NAMES, EVENT_TYPE_LABELS, OUTCOME_LABELS } from '../data/db';

export default function ComparePage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('year');
  const [splitView, setSplitView] = useState(false);
  const [splitSources, setSplitSources] = useState({ left: null, right: null });

  const sorted = useMemo(() => [...clusters].sort((a, b) => {
    if (sortBy === 'year') return a.y - b.y;
    if (sortBy === 'sources') return b.srcs.length - a.srcs.length;
    return b.cnt - a.cnt;
  }), [sortBy]);

  const selectedCluster = clusters.find(c => c.id === selected);
  const clusterEvents = selected ? events.filter(e => e.c === selected) : [];

  function enterSplitView(cl) {
    const evs = events.filter(e => e.c === cl.id);
    const availableSrcs = [...new Set(evs.map(e => e.s))];
    setSplitSources({ left: availableSrcs[0] || null, right: availableSrcs[1] || availableSrcs[0] || null });
    setSelected(cl.id);
    setSplitView(true);
  }

  const leftEvents = clusterEvents.filter(e => e.s === splitSources.left);
  const rightEvents = clusterEvents.filter(e => e.s === splitSources.right);
  const clusterSrcShorts = selected ? [...new Set(clusterEvents.map(e => e.s))] : [];

  return (
    <PageTransition>
      <div className="pt-20 pb-8 bg-geometric min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl text-gold font-light tracking-wide mb-2">{t('compare.title')}</h1>
            <p className="font-arabic text-gold-dim text-xl">مقارنة الروايات</p>
            <p className="text-parchment-faint text-sm mt-3 max-w-xl">{t('compare.subtitle')}</p>
            <div className="gold-line w-20 mt-4" />
          </motion.div>

          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {[
              { key: 'year', label: t('compare.sort_year') },
              { key: 'sources', label: t('compare.sort_source') },
              { key: 'records', label: t('compare.sort_count') },
            ].map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)}
                className={`tag cursor-pointer transition-colors ${sortBy === s.key ? 'bg-gold/15 border-gold/30 text-gold' : 'hover:border-gold/20'}`}>
                {s.label}
              </button>
            ))}
            {splitView && (
              <button onClick={() => setSplitView(false)}
                className="tag cursor-pointer bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 ml-auto">
                ✕ {t('compare.exit_split')}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {splitView && selectedCluster ? (
              <motion.div key="split" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {['left', 'right'].map(side => (
                    <div key={side} className="glass-card p-3">
                      <label className="text-gold text-xs uppercase tracking-widest font-semibold mb-2 block">
                        {side === 'left' ? t('compare.source_a') : t('compare.source_b')}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {clusterSrcShorts.map(s => (
                          <button key={s} onClick={() => setSplitSources(p => ({ ...p, [side]: s }))}
                            className={`tag cursor-pointer text-xs transition-all ${splitSources[side] === s ? 'bg-gold/15 border-gold/30' : 'hover:border-gold/20'}`}
                            style={splitSources[side] === s ? { borderColor: SRC_COLORS[s], color: SRC_COLORS[s] } : {}}>
                            {SRC_NAMES[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-card p-4 mb-4 flex items-center gap-3">
                  <span className="text-gold text-xl font-bold">{selectedCluster.y}</span>
                  <span className="text-parchment text-lg">{selectedCluster.loc}</span>
                  <span className="tag text-xs">{clusterEvents.length} {t('compare.records')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[{ evs: leftEvents, src: splitSources.left }, { evs: rightEvents, src: splitSources.right }].map(({ evs, src }, idx) => {
                    const color = SRC_COLORS[src] || '#888';
                    return (
                      <div key={idx} className="glass-card overflow-hidden">
                        <div className="p-3 border-b border-gold/10 flex items-center gap-2" style={{ borderTopColor: color, borderTopWidth: 3 }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-sm font-semibold" style={{ color }}>{SRC_NAMES[src]}</span>
                          <span className="text-parchment-faint text-xs ml-auto">{evs.length} {t('compare.records')}</span>
                        </div>
                        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                          {evs.length === 0 ? (
                            <p className="text-parchment-faint text-sm italic">{t('compare.no_events')}</p>
                          ) : evs.map((ev, i) => (
                            <div key={i} className="bg-ink-200/50 border border-gold/5 rounded-lg p-4">
                              <h4 className="text-parchment-dim text-sm mb-1 font-medium">{ev.n}</h4>
                              {ev.r && <div className="font-arabic text-parchment-faint text-sm leading-[1.8] mt-2 text-right p-2 bg-gold/[0.02] rounded" dir="rtl">{ev.r}</div>}
                              <div className="flex gap-1.5 mt-2">
                                <span className="tag text-[0.6rem]">{ev.y}</span>
                                <span className="tag text-[0.6rem]">{EVENT_TYPE_LABELS[ev.t] || ev.t}</span>
                                <span className="tag text-[0.6rem]">{ev.l}</span>
                                {ev.u && ev.u !== 'not_applicable' && ev.u !== 'inconclusive' && <span className="tag text-[0.6rem]">{OUTCOME_LABELS[ev.u] || ev.u}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {leftEvents.length > 0 && rightEvents.length > 0 && (
                  <div className="glass-card p-5 mt-6">
                    <h4 className="text-gold text-sm uppercase tracking-widest mb-3 font-semibold">{t('compare.diff_title')}</h4>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      {[{ evs: leftEvents, src: splitSources.left }, { evs: rightEvents, src: splitSources.right }].map(({ evs, src }, idx) => (
                        <div key={idx}>
                          <p className="text-parchment-faint mb-2 font-medium">{SRC_NAMES[src]}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {[...new Set(evs.map(e => e.t))].map(tp => <span key={tp} className="tag text-[0.6rem]">{EVENT_TYPE_LABELS[tp] || tp}</span>)}
                          </div>
                          <p className="text-parchment-dim text-xs">{evs.length} {t('compare.records')} · {[...new Set(evs.map(e => e.l))].join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {sorted.map((cl, i) => {
                  const clEvents = events.filter(e => e.c === cl.id);
                  const isOpen = selected === cl.id && !splitView;
                  return (
                    <ScrollReveal key={cl.id} delay={Math.min(i * 0.03, 0.3)}>
                      <div className="glass-card overflow-hidden">
                        <div className="p-5 cursor-pointer flex items-center gap-4 group" onClick={() => setSelected(isOpen ? null : cl.id)}>
                          <span className="text-gold text-lg font-semibold w-14 text-right flex-shrink-0">{cl.y}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-parchment font-medium group-hover:text-gold transition-colors">{cl.loc}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {cl.srcs.map(s => <span key={s} className="tag text-[0.65rem]" style={{ borderColor: SRC_COLORS[s], color: SRC_COLORS[s] }}>{SRC_NAMES[s]}</span>)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {cl.srcs.length >= 2 && (
                              <button onClick={e => { e.stopPropagation(); enterSplitView(cl); }}
                                className="tag cursor-pointer text-[0.6rem] bg-gold/5 hover:bg-gold/15 border-gold/20 text-gold transition-colors">
                                ⬡ {t('compare.split_btn')}
                              </button>
                            )}
                            <div className="text-center">
                              <span className="text-gold font-bold text-lg">{cl.cnt}</span>
                              <span className="text-parchment-faint text-xs block">{t('compare.records')}</span>
                            </div>
                            <motion.svg className="w-4 h-4 text-parchment-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" animate={{ rotate: isOpen ? 180 : 0 }}>
                              <path d="M6 9l6 6 6-6" />
                            </motion.svg>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                              <div className="border-t border-gold/10 p-5">
                                {clEvents.length > 0 ? (
                                  <div className="grid sm:grid-cols-2 gap-3">
                                    {clEvents.map((ev, j) => (
                                      <div key={j} className="bg-ink-200/50 border border-gold/5 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="w-2 h-2 rounded-full" style={{ background: SRC_COLORS[ev.s] }} />
                                          <span className="text-xs font-semibold" style={{ color: SRC_COLORS[ev.s] }}>{SRC_NAMES[ev.s]}</span>
                                        </div>
                                        <h4 className="text-parchment-dim text-sm mb-1">{ev.n}</h4>
                                        {ev.r && <div className="font-arabic text-parchment-faint text-sm leading-relaxed mt-2 text-right" dir="rtl">{ev.r}</div>}
                                        <div className="flex gap-1.5 mt-2">
                                          <span className="tag text-[0.6rem]">{EVENT_TYPE_LABELS[ev.t] || ev.t}</span>
                                          <span className="tag text-[0.6rem]">{ev.l}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : <p className="text-parchment-faint text-sm italic">Bu küme {cl.cnt} kayıt içermektedir.</p>}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
