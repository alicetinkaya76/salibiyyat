import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import { sources, events, SRC_COLORS } from '../data/db';

const perspectiveLabels = {
  standard_chronicle: 'Standart Kronik',
  anecdotal_eyewitness: 'Anekdotal Görgü Tanığı',
  comprehensive_chronicle: 'Kapsamlı Kronik',
  eyewitness_biography: 'Görgü Tanığı Biyografisi',
  literary_chronicle: 'Edebî Kronik',
};

export default function SourcesPage() {
  const { t } = useTranslation();
  return (
    <PageTransition>
      <div className="pt-20 pb-8 bg-geometric min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-3xl text-gold font-light tracking-wide mb-2">{t('sources_page.title')}</h1>
            <p className="font-arabic text-gold-dim text-xl">المصادر الأولية</p>
            <p className="text-parchment-faint text-sm mt-3 max-w-xl">
              {t('sources_page.subtitle')}
            </p>
            <div className="gold-line w-20 mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {sources.map((s, i) => {
              const srcEvents = events.filter(e => e.s === s.short);
              const typeCount = {};
              srcEvents.forEach(e => { typeCount[e.t] = (typeCount[e.t] || 0) + 1; });
              const topTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 4);
              const yearRange = srcEvents.length ? [Math.min(...srcEvents.map(e => e.y)), Math.max(...srcEvents.map(e => e.y))] : [0, 0];

              return (
                <ScrollReveal key={s.id} delay={i * 0.07}>
                  <Link to={`/sources/${s.id}`} className="glass-card p-6 block group relative overflow-hidden h-full">
                    {/* Accent */}
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: s.color }} />
                    <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full transition-all duration-700" style={{ background: s.color, filter: 'brightness(1.5)' }} />

                    <div className="ml-4">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-parchment font-semibold text-lg group-hover:text-gold transition-colors">{s.full_tr}</h2>
                          <p className="text-parchment-faint text-xs mt-0.5">{s.full_en}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="font-arabic text-gold text-2xl leading-tight">{s.name_ar}</div>
                          <div className="font-arabic text-parchment-faint text-sm mt-1" dir="rtl">{s.work_ar}</div>
                        </div>
                      </div>

                      {/* Work name */}
                      <p className="text-parchment-dim text-sm italic mb-3">{s.work_tr}</p>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="tag font-semibold" style={{ borderColor: s.color, color: s.color }}>
                          {s.record_count} kayıt
                        </span>
                        <span className="tag">{s.period}</span>
                        <span className="tag">{perspectiveLabels[s.perspective] || s.perspective}</span>
                      </div>

                      {/* Mini bar chart of event types */}
                      <div className="space-y-1.5">
                        {topTypes.map(([type, cnt]) => (
                          <div key={type} className="flex items-center gap-2 text-xs">
                            <span className="text-parchment-faint w-24 text-right">{type.replace(/_/g, ' ')}</span>
                            <div className="flex-1 h-1.5 bg-ink-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${(cnt / srcEvents.length) * 100}%`, background: s.color, opacity: 0.7 }}
                              />
                            </div>
                            <span className="text-parchment-faint w-6">{cnt}</span>
                          </div>
                        ))}
                      </div>

                      {/* Arrow */}
                      <div className="mt-4 flex items-center gap-1 text-gold-dim text-xs group-hover:text-gold transition-colors">
                        Detay
                        <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
