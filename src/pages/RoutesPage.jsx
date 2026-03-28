import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import Footer from '../components/Footer';
import { routes, toRoman } from '../data/db';
import L from 'leaflet';

export default function RoutesPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const miniMapRef = useRef(null);
  const miniMapInstance = useRef(null);

  useEffect(() => {
    if (!selected || !miniMapRef.current) return;

    if (miniMapInstance.current) { miniMapInstance.current.remove(); miniMapInstance.current = null; }

    const map = L.map(miniMapRef.current, { zoomControl: false, attributionControl: false }).setView([38, 28], 4);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, subdomains: 'abcd' }).addTo(map);

    const r = selected;
    const coords = r.wp.map(w => [w.a, w.o]);
    L.polyline(coords, {
      color: r.col, weight: r.tp === 'land' ? 4 : 3,
      opacity: 0.8, dashArray: r.tp === 'sea' ? '10,8' : null,
    }).addTo(map);

    r.wp.forEach((w, i) => {
      const m = L.circleMarker([w.a, w.o], {
        radius: i === 0 || i === r.wp.length - 1 ? 6 : 4,
        fillColor: r.col, color: '#fff', weight: 1.5, fillOpacity: 0.9,
      });
      m.bindTooltip(`${i + 1}. ${w.n}`, { permanent: i === 0 || i === r.wp.length - 1, direction: 'top', offset: [0, -8] });
      m.addTo(map);
    });

    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [30, 30] });
    miniMapInstance.current = map;

    return () => { if (miniMapInstance.current) { miniMapInstance.current.remove(); miniMapInstance.current = null; } };
  }, [selected]);

  return (
    <PageTransition>
      <div className="pt-20 pb-8 bg-geometric min-h-screen">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl text-gold font-light tracking-wide mb-2">{t('routes_page.title')}</h1>
            <p className="font-arabic text-gold-dim text-xl">{t('routes_page.subtitle_ar')}</p>
            <p className="text-parchment-faint text-sm mt-3 max-w-xl">
              {t('routes_page.subtitle')}
            </p>
            <div className="gold-line w-20 mt-4" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Routes list */}
            <div className="space-y-3">
              {routes.map((r, i) => (
                <ScrollReveal key={r.id} delay={i * 0.05}>
                  <div
                    className={`glass-card p-5 cursor-pointer relative overflow-hidden group ${selected?.id === r.id ? 'border-gold/30 bg-gold/5' : ''}`}
                    onClick={() => setSelected(r)}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: r.col }} />
                    <div className="ml-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{r.tp === 'land' ? '🛤' : '⚓'}</span>
                        <div>
                          <h3 className="text-parchment font-medium group-hover:text-gold transition-colors">
                            {toRoman(r.cr)}. Haçlı Seferi — {r.tp === 'land' ? t('routes_page.land_route') : t('routes_page.sea_route')}
                          </h3>
                          <p className="text-parchment-faint text-xs">{r.nt}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="tag" style={{ borderColor: r.col, color: r.col }}>{r.yr}</span>
                        <span className="tag">{r.wp.length} durak</span>
                        <span className="tag">{r.tp === 'land' ? 'Kara' : 'Deniz'}</span>
                      </div>
                      <p className="text-parchment-faint text-xs">{r.ld}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Detail / Mini map */}
            <div className="sticky top-20 h-fit">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  <div ref={miniMapRef} className="w-full h-72" />
                  <div className="p-5">
                    <h3 className="text-gold text-lg font-medium mb-1">{selected.nt}</h3>
                    <p className="text-parchment-faint text-sm mb-4">{selected.ne}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="tag" style={{ borderColor: selected.col, color: selected.col }}>{selected.yr}</span>
                      <span className="tag">{selected.tp === 'land' ? 'Kara yolu' : 'Deniz yolu'}</span>
                    </div>

                    <h4 className="text-gold-dim text-xs uppercase tracking-widest mb-2">Liderler</h4>
                    <p className="text-parchment-dim text-sm mb-4">{selected.ld}</p>

                    <h4 className="text-gold-dim text-xs uppercase tracking-widest mb-2">Duraklar ({selected.wp.length})</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {selected.wp.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-gold text-xs font-semibold w-5 text-right">{i + 1}</span>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: selected.col }} />
                          <span className="text-parchment-dim">{w.n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-card p-10 text-center">
                  <div className="text-4xl mb-3 opacity-30">🗺</div>
                  <p className="text-parchment-faint text-sm">Bir güzergâh seçin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
