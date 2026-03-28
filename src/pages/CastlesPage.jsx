import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import { castles } from '../data/db';

export default function CastlesPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const types = [...new Set(castles.map(c => c.tp).filter(Boolean))];
  const filtered = filter === 'all' ? castles : castles.filter(c => c.tp === filter);

  return (
    <PageTransition>
      <div className="pt-20 pb-8 bg-geometric min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl text-gold font-light tracking-wide mb-2">{t('castles_page.title')}</h1>
            <p className="font-arabic text-gold-dim text-xl">القلاع الصليبية</p>
            <p className="text-parchment-faint text-sm mt-3 max-w-xl">
              24 önemli kale — fotoğraflar, el değiştirme kronolojisi ve üç dilli isimlerle.
            </p>
            <div className="gold-line w-20 mt-4" />
          </motion.div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`tag cursor-pointer transition-colors ${filter === 'all' ? 'bg-gold/15 border-gold/30 text-gold' : 'hover:border-gold/20'}`}
            >
              Tümü ({castles.length})
            </button>
            {types.map(t => {
              const cnt = castles.filter(c => c.tp === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`tag cursor-pointer transition-colors ${filter === t ? 'bg-gold/15 border-gold/30 text-gold' : 'hover:border-gold/20'}`}
                >
                  {t.replace(/_/g, ' ')} ({cnt})
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c, i) => (
              <ScrollReveal key={c.id} delay={i * 0.04}>
                <div
                  className="glass-card overflow-hidden cursor-pointer group"
                  onClick={() => setSelected(c)}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-ink-200 relative overflow-hidden">
                    {c.img ? (
                      <img
                        src={c.img}
                        alt={c.ne}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🏰</div>
                    )}
                    {c.un && (
                      <div className="absolute top-2 right-2 bg-gold/90 text-ink-100 text-[0.6rem] font-bold px-1.5 py-0.5 rounded">
                        UNESCO
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-parchment font-medium text-sm group-hover:text-gold transition-colors">{c.nt}</h3>
                    <div className="font-arabic text-gold-dim text-sm mt-0.5" dir="rtl">{c.na}</div>
                    <p className="text-parchment-faint text-xs mt-1.5">{c.ne}</p>
                    {c.st && <span className="tag text-[0.6rem] mt-2 inline-block">{c.st}</span>}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-ink-100/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-ink-50 border border-gold/15 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Image */}
              {selected.img && (
                <div className="aspect-[16/9] overflow-hidden rounded-t-xl">
                  <img src={selected.img} alt={selected.ne} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl text-gold font-medium">{selected.nt}</h2>
                    <p className="text-parchment-faint text-sm">{selected.ne}</p>
                  </div>
                  <div className="font-arabic text-gold-dim text-2xl" dir="rtl">{selected.na}</div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selected.un && <span className="tag" style={{ borderColor: '#f39c12', color: '#f39c12' }}>UNESCO</span>}
                  {selected.tp && <span className="tag">{selected.tp.replace(/_/g, ' ')}</span>}
                  {selected.st && <span className="tag">{selected.st}</span>}
                </div>

                {selected.dt && <p className="text-parchment-dim text-sm leading-relaxed mb-4">{selected.dt}</p>}

                {selected.own && (
                  <div className="glass-card p-4 mb-4">
                    <h4 className="text-gold text-xs uppercase tracking-widest mb-2">El Değiştirme Kronolojisi</h4>
                    <p className="text-parchment-faint text-sm leading-relaxed">{selected.own}</p>
                  </div>
                )}

                <button
                  onClick={() => setSelected(null)}
                  className="w-full mt-2 py-2.5 bg-gold/10 border border-gold/20 rounded-lg text-gold text-sm hover:bg-gold/15 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </PageTransition>
  );
}
