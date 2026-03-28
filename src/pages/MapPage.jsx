import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import useRoutePlayback from '../hooks/useRoutePlayback';
import {
  sources, events, castles, boundaries, routes, clusters,
  SRC_COLORS, SRC_NAMES, EVENT_TYPE_LABELS, OUTCOME_LABELS,
  toRoman, getAllBoundaryYears,
} from '../data/db';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const BOUNDARY_YEARS = getAllBoundaryYears();
const ALL_SRC_SHORTS = sources.map(s => s.short);
const LAYER_KEYS = ['events', 'castles', 'boundaries', 'routes'];

function parseUrlFilters(searchParams) {
  const srcParam = searchParams.get('src');
  const yearParam = searchParams.get('year');
  const layerParam = searchParams.get('layer');

  const srcFilter = srcParam
    ? Object.fromEntries(ALL_SRC_SHORTS.map(s => [s, srcParam.split(',').includes(s)]))
    : Object.fromEntries(ALL_SRC_SHORTS.map(s => [s, true]));

  const layerFilter = layerParam
    ? Object.fromEntries(LAYER_KEYS.map(k => [k, layerParam.split(',').includes(k)]))
    : { events: true, castles: true, boundaries: true, routes: true };

  const maxYear = yearParam ? Math.min(1466, Math.max(1096, parseInt(yearParam, 10) || 1466)) : 1466;

  return { srcFilter, layerFilter, maxYear };
}

export default function MapPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layersRef = useRef({ clusterGroup: null, castles: [], boundaries: {}, routes: {}, routeWps: {} });

  const urlDefaults = useMemo(() => parseUrlFilters(searchParams), []);

  const [filters, setFilters] = useState({
    sources: urlDefaults.srcFilter,
    layers: urlDefaults.layerFilter,
    routes: Object.fromEntries(routes.map(r => [r.id, true])),
    maxYear: urlDefaults.maxYear,
    boundaryIdx: 0,
  });
  const [detail, setDetail] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(events.length);

  const { playing, activeRouteId, progress, play, stop } = useRoutePlayback(mapInst);

  // Sync filters → URL (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = {};
      const activeSrcs = ALL_SRC_SHORTS.filter(s => filters.sources[s]);
      if (activeSrcs.length < ALL_SRC_SHORTS.length) params.src = activeSrcs.join(',');
      if (filters.maxYear < 1466) params.year = String(filters.maxYear);
      const activeLayers = LAYER_KEYS.filter(k => filters.layers[k]);
      if (activeLayers.length < LAYER_KEYS.length) params.layer = activeLayers.join(',');
      setSearchParams(params, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [filters.sources, filters.maxYear, filters.layers]);

  // ─── Init ───
  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([35, 30], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, subdomains: 'abcd' }).addTo(map);
    mapInst.current = map;

    const cg = L.markerClusterGroup({
      maxClusterRadius: 35, spiderfyOnMaxZoom: true, showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 'small' : count < 50 ? 'medium' : 'large';
        return L.divIcon({ html: `<div><span>${count}</span></div>`, className: `marker-cluster marker-cluster-${size}`, iconSize: L.point(36, 36) });
      },
    });

    events.forEach(ev => {
      const color = SRC_COLORS[ev.s] || '#888';
      const isCl = !!ev.c;
      const m = L.circleMarker([ev.a, ev.o], { radius: isCl ? 5.5 : 3.5, fillColor: color, color: isCl ? '#d4a848' : color, weight: isCl ? 2 : 1, opacity: 0.85, fillOpacity: 0.65 });
      m.bindPopup(`<div class="event-popup"><h4>${ev.n}</h4>${ev.r ? '<div class="ar">' + ev.r + '</div>' : ''}<div class="meta">${ev.y} · ${ev.l} · ${SRC_NAMES[ev.s]} · ${EVENT_TYPE_LABELS[ev.t] || ev.t}</div></div>`, { maxWidth: 280 });
      m.on('click', () => setDetail({ type: 'event', data: ev }));
      m._evData = ev;
      cg.addLayer(m);
    });
    map.addLayer(cg);
    layersRef.current.clusterGroup = cg;

    castles.forEach(c => {
      const icon = L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14],
        html: `<div style="font-size:24px;filter:drop-shadow(0 0 8px rgba(212,168,72,0.4));cursor:pointer;transition:transform 0.3s" onmouseenter="this.style.transform='scale(1.3)'" onmouseleave="this.style.transform='scale(1)'">🏰</div>` });
      const m = L.marker([c.lat, c.lon], { icon });
      let popup = '<div class="castle-popup">';
      if (c.img) popup += `<img src="${c.img}" alt="${c.ne}" onerror="this.style.display='none'"/>`;
      popup += `<h4>${c.nt}</h4><div class="ar">${c.na}</div><div class="meta">${c.ne}${c.un ? ' · UNESCO' : ''}</div></div>`;
      m.bindPopup(popup, { maxWidth: 260 });
      m.on('click', () => setDetail({ type: 'castle', data: c }));
      m.addTo(map);
      layersRef.current.castles.push(m);
    });

    boundaries.forEach(b => {
      layersRef.current.boundaries[b.id] = [];
      b.sn.forEach(snap => {
        const poly = L.polygon(snap.p.map(p => [p[0], p[1]]), { color: b.col, fillColor: b.col, fillOpacity: 0.1, weight: 2, opacity: 0.6, dashArray: '5,5' });
        poly.bindTooltip(`${b.nt} (${snap.y})`, { sticky: true });
        poly._year = snap.y;
        layersRef.current.boundaries[b.id].push(poly);
      });
    });

    routes.forEach(r => {
      const coords = r.wp.map(w => [w.a, w.o]);
      const line = L.polyline(coords, { color: r.col, weight: r.tp === 'land' ? 3 : 2.5, opacity: 0.7, dashArray: r.tp === 'sea' ? '8,6' : null, lineCap: 'round', lineJoin: 'round' });
      line.bindTooltip(`${r.nt} (${r.yr})`, { sticky: true });
      line.addTo(map);
      layersRef.current.routes[r.id] = line;
      layersRef.current.routeWps[r.id] = [];
      r.wp.forEach(w => {
        const wm = L.circleMarker([w.a, w.o], { radius: 3, fillColor: r.col, color: '#fff', weight: 1, fillOpacity: 0.8 });
        wm.bindTooltip(w.n, { direction: 'top', offset: [0, -6] });
        wm.addTo(map);
        layersRef.current.routeWps[r.id].push(wm);
      });
    });

    refreshBoundaries(map, 0, true);
    return () => { map.remove(); mapInst.current = null; };
  }, []);

  // ─── Filter effects ───
  useEffect(() => {
    const cg = layersRef.current.clusterGroup;
    const map = mapInst.current;
    if (!cg || !map) return;
    cg.clearLayers();
    let count = 0;
    if (filters.layers.events) {
      events.forEach(ev => {
        if (!filters.sources[ev.s] || ev.y > filters.maxYear) return;
        const color = SRC_COLORS[ev.s] || '#888';
        const isCl = !!ev.c;
        const m = L.circleMarker([ev.a, ev.o], { radius: isCl ? 5.5 : 3.5, fillColor: color, color: isCl ? '#d4a848' : color, weight: isCl ? 2 : 1, opacity: 0.85, fillOpacity: 0.65 });
        m.bindPopup(`<div class="event-popup"><h4>${ev.n}</h4>${ev.r ? '<div class="ar">' + ev.r + '</div>' : ''}<div class="meta">${ev.y} · ${ev.l} · ${SRC_NAMES[ev.s]} · ${EVENT_TYPE_LABELS[ev.t] || ev.t}</div></div>`, { maxWidth: 280 });
        m.on('click', () => setDetail({ type: 'event', data: ev }));
        cg.addLayer(m);
        count++;
      });
    }
    setVisibleCount(count);
  }, [filters.sources, filters.maxYear, filters.layers.events]);

  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    layersRef.current.castles.forEach(m => {
      if (filters.layers.castles && !map.hasLayer(m)) map.addLayer(m);
      else if (!filters.layers.castles && map.hasLayer(m)) map.removeLayer(m);
    });
  }, [filters.layers.castles]);

  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    refreshBoundaries(map, filters.boundaryIdx, filters.layers.boundaries);
  }, [filters.boundaryIdx, filters.layers.boundaries]);

  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    Object.keys(layersRef.current.routes).forEach(id => {
      const vis = filters.layers.routes && filters.routes[id];
      const line = layersRef.current.routes[id];
      if (vis && !map.hasLayer(line)) line.addTo(map);
      else if (!vis && map.hasLayer(line)) map.removeLayer(line);
      (layersRef.current.routeWps[id] || []).forEach(wm => {
        if (vis && !map.hasLayer(wm)) wm.addTo(map);
        else if (!vis && map.hasLayer(wm)) map.removeLayer(wm);
      });
    });
  }, [filters.routes, filters.layers.routes]);

  function refreshBoundaries(map, idx, show) {
    const targetYear = BOUNDARY_YEARS[idx] || BOUNDARY_YEARS[0];
    Object.keys(layersRef.current.boundaries).forEach(bid => {
      layersRef.current.boundaries[bid].forEach(poly => map.removeLayer(poly));
      if (!show) return;
      const snaps = layersRef.current.boundaries[bid].filter(p => p._year <= targetYear);
      if (snaps.length > 0) snaps[snaps.length - 1].addTo(map);
    });
  }

  const toggleSource = (k) => setFilters(f => ({ ...f, sources: { ...f.sources, [k]: !f.sources[k] } }));
  const toggleLayer = (k) => setFilters(f => ({ ...f, layers: { ...f.layers, [k]: !f.layers[k] } }));
  const toggleRoute = (k) => setFilters(f => ({ ...f, routes: { ...f.routes, [k]: !f.routes[k] } }));

  return (
    <PageTransition className="pt-14 h-screen flex">
      {/* ─── SIDEBAR ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-80 flex-shrink-0 bg-ink-100/95 backdrop-blur-xl border-r border-gold/10 overflow-y-auto hidden md:block"
            style={{ height: 'calc(100vh - 56px)' }}>
            <div className="p-4 space-y-5">
              <SidebarSection title={`☪ ${t('map.sources_title')}`}>
                {sources.map(s => (
                  <FilterItem key={s.short} checked={filters.sources[s.short]} onChange={() => toggleSource(s.short)}
                    color={s.color} label={s.full_tr} count={events.filter(e => e.s === s.short).length} />
                ))}
              </SidebarSection>

              <SidebarSection title={`⬡ ${t('map.layers_title')}`}>
                {[
                  { id: 'events', label: `⬤ ${t('map.events_layer')}` },
                  { id: 'castles', label: `🏰 ${t('map.castles_layer')}` },
                  { id: 'boundaries', label: `▧ ${t('map.boundaries_layer')}` },
                  { id: 'routes', label: `━ ${t('map.routes_layer')}` },
                ].map(l => (
                  <FilterItem key={l.id} checked={filters.layers[l.id]} onChange={() => toggleLayer(l.id)} label={l.label} />
                ))}
              </SidebarSection>

              <SidebarSection title={`⚔ ${t('map.routes_title')}`}>
                {routes.map(r => (
                  <div key={r.id} className="flex items-center gap-1">
                    <FilterItem checked={filters.routes[r.id]} onChange={() => toggleRoute(r.id)}
                      color={r.col} label={`${toRoman(r.cr)}. (${r.tp === 'land' ? t('map.land') : t('map.sea')})`} />
                    <button
                      onClick={() => playing && activeRouteId === r.id ? stop() : play(r)}
                      className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-[0.65rem] transition-all ${
                        playing && activeRouteId === r.id
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-gold/10 text-gold/70 border border-gold/15 hover:bg-gold/20 hover:text-gold'
                      }`}
                      title={playing && activeRouteId === r.id ? t('map.stop_route') : t('map.play_route')}>
                      {playing && activeRouteId === r.id ? '■' : '▶'}
                    </button>
                  </div>
                ))}
                {playing && (
                  <div className="mt-2 p-2 bg-gold/5 border border-gold/15 rounded-lg">
                    <div className="text-gold text-[0.7rem] font-semibold">{progress.name}</div>
                    <div className="text-parchment-faint text-[0.6rem]">Durak {progress.idx + 1}</div>
                  </div>
                )}
              </SidebarSection>

              <SidebarSection title={`📅 ${t('map.year_range')}`}>
                <input type="range" min="1096" max="1466" value={filters.maxYear} step="1"
                  onChange={e => setFilters(f => ({ ...f, maxYear: +e.target.value }))}
                  className="w-full accent-gold cursor-pointer h-1" />
                <div className="text-center text-gold text-sm font-semibold mt-1.5">1096 — {filters.maxYear}</div>
              </SidebarSection>

              <SidebarSection title={`🗺 ${t('map.boundary_year')}`}>
                <input type="range" min="0" max={BOUNDARY_YEARS.length - 1} value={filters.boundaryIdx} step="1"
                  onChange={e => setFilters(f => ({ ...f, boundaryIdx: +e.target.value }))}
                  className="w-full accent-gold cursor-pointer h-1" />
                <div className="text-center text-gold text-sm font-semibold mt-1.5">{BOUNDARY_YEARS[filters.boundaryIdx]}</div>
              </SidebarSection>

              <SidebarSection title={`📊 ${t('map.stats_title')}`}>
                <div className="text-xs text-parchment-faint space-y-1.5">
                  <div className="flex justify-between"><span>{t('map.visible_events')}</span><span className="text-gold font-semibold">{visibleCount} <span className="text-parchment-faint font-normal">/ {events.length}</span></span></div>
                  <div className="flex justify-between"><span>{t('map.castle_count')}</span><span className="text-gold font-semibold">{castles.length}</span></div>
                  <div className="flex justify-between"><span>{t('map.route_count')}</span><span className="text-gold font-semibold">{routes.length}</span></div>
                  <div className="flex justify-between"><span>{t('map.cluster_count')}</span><span className="text-gold font-semibold">{clusters.length}</span></div>
                </div>
              </SidebarSection>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── MAP ─── */}
      <div className="flex-1 relative" style={{ height: 'calc(100vh - 56px)' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex absolute top-3 left-3 z-[700] w-8 h-8 items-center justify-center bg-ink-100/80 backdrop-blur-md border border-gold/12 rounded-lg text-parchment-faint hover:text-gold hover:border-gold/25 transition-all duration-300 text-xs">
          {sidebarOpen ? '◀' : '▶'}
        </button>

        <div ref={mapRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-5 left-4 z-[700] bg-ink-100/90 backdrop-blur-xl border border-gold/12 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <h4 className="text-gold text-[0.72rem] font-semibold mb-2 tracking-wider uppercase">{t('map.legend')}</h4>
          {sources.map(s => (
            <div key={s.short} className="flex items-center gap-2 mb-1 text-parchment-dim text-[0.72rem]">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              {s.full_tr}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gold/10 text-parchment-dim text-[0.72rem]">
            <div className="w-2 h-2 rounded-full flex-shrink-0 border-2 border-gold bg-gold/20" />
            {t('map.multi_source')}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {detail && (
            <motion.div
              initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="absolute top-0 right-0 w-[360px] h-full bg-ink-100/95 backdrop-blur-2xl border-l border-gold/12 z-[800] overflow-y-auto p-5 shadow-[-8px_0_32px_rgba(0,0,0,0.3)]">
              <button onClick={() => setDetail(null)} className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-ink-200/50 flex items-center justify-center text-parchment-faint hover:text-gold hover:bg-gold/10 transition-all text-sm">✕</button>
              {detail.type === 'event' && <EventDetail ev={detail.data} />}
              {detail.type === 'castle' && <CastleDetail c={detail.data} t={t} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function SidebarSection({ title, children }) {
  return (
    <div>
      <h3 className="text-gold text-[0.75rem] font-semibold uppercase tracking-[0.08em] mb-2.5 flex items-center gap-2">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterItem({ checked, onChange, color, label, count }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer text-[0.8rem] text-parchment-dim hover:text-parchment transition-colors group">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-gold w-3.5 h-3.5 cursor-pointer rounded" />
      {color && (
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
          style={{ background: color, boxShadow: checked ? `0 0 6px ${color}40` : 'none' }} />
      )}
      <span className="flex-1 truncate">{label}</span>
      {count != null && <span className="text-parchment-faint text-[0.68rem] tabular-nums">{count}</span>}
    </label>
  );
}

function EventDetail({ ev }) {
  return (
    <>
      <h3 className="text-gold text-lg font-medium pr-10 mb-3 leading-snug">{ev.n}</h3>
      {ev.r && <div className="font-arabic text-gold-dim text-lg leading-[1.7] text-right mb-4 p-3 rounded-lg bg-gold/[0.03] border border-gold/[0.06]" dir="rtl">{ev.r}</div>}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="tag font-semibold">{ev.y}</span>
        <span className="tag">{ev.l}</span>
        <span className="tag" style={{ borderColor: SRC_COLORS[ev.s] + '44', color: SRC_COLORS[ev.s] }}>{SRC_NAMES[ev.s]}</span>
        <span className="tag">{EVENT_TYPE_LABELS[ev.t] || ev.t}</span>
        {ev.u && ev.u !== 'not_applicable' && <span className="tag">{OUTCOME_LABELS[ev.u] || ev.u}</span>}
      </div>
      {ev.c && <p className="text-gold/70 text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border-2 border-gold bg-gold/20 inline-block" /> Bu olay çok kaynaklı bir kümeye aittir</p>}
    </>
  );
}

function CastleDetail({ c, t }) {
  return (
    <>
      <h3 className="text-gold text-lg font-medium pr-10 mb-2">{c.nt}</h3>
      <div className="font-arabic text-gold-dim text-xl text-right mb-3" dir="rtl">{c.na}</div>
      {c.img && <img src={c.img} alt={c.ne} className="w-full rounded-xl border border-gold/12 mb-4 shadow-lg" onError={e => e.target.style.display = 'none'} />}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="tag">{c.ne}</span>
        {c.un && <span className="tag" style={{ borderColor: '#f39c1280', color: '#f39c12' }}>UNESCO</span>}
        {c.tp && <span className="tag">{c.tp.replace(/_/g, ' ')}</span>}
        {c.st && <span className="tag">{c.st}</span>}
      </div>
      {c.dt && <p className="text-parchment-dim text-sm leading-relaxed mb-3">{c.dt}</p>}
      {c.own && (
        <div className="glass-card-flat p-3.5 mt-3">
          <h4 className="text-gold text-xs uppercase tracking-widest mb-1.5 font-semibold">{t('map.ownership')}</h4>
          <p className="text-parchment-faint text-xs leading-relaxed">{c.own}</p>
        </div>
      )}
    </>
  );
}
