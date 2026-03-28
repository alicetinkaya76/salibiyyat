import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { events, castles, routes, sources, clusters, SRC_NAMES, SRC_COLORS, EVENT_TYPE_LABELS, toRoman } from '../data/db';

// Build searchable index once
function buildIndex() {
  const items = [];

  // Events (top 200 by distinctness)
  const seenLocs = new Set();
  events.forEach(ev => {
    if (seenLocs.size > 250) return;
    const key = `${ev.l}-${ev.y}`;
    if (seenLocs.has(key)) return;
    seenLocs.add(key);
    items.push({
      type: 'event', icon: '📜', label: ev.n,
      sub: `${ev.y} · ${SRC_NAMES[ev.s]} · ${EVENT_TYPE_LABELS[ev.t] || ev.t}`,
      color: SRC_COLORS[ev.s], path: '/map', query: ev.l,
      search: `${ev.n} ${ev.l} ${ev.r || ''} ${ev.y}`.toLowerCase(),
    });
  });

  // Castles
  castles.forEach(c => {
    items.push({
      type: 'castle', icon: '🏰', label: c.nt,
      sub: `${c.ne} · ${c.na}`,
      path: '/castles', search: `${c.nt} ${c.ne} ${c.na}`.toLowerCase(),
    });
  });

  // Routes
  routes.forEach(r => {
    items.push({
      type: 'route', icon: r.tp === 'land' ? '🛤' : '⚓', label: r.nt,
      sub: `${r.yr} · ${r.wp.length} durak · ${r.ld}`,
      color: r.col, path: '/routes',
      search: `${r.nt} ${r.ne} ${r.ld} ${r.yr}`.toLowerCase(),
    });
  });

  // Sources
  sources.forEach(s => {
    items.push({
      type: 'source', icon: '📖', label: s.full_tr,
      sub: `${s.work_tr} · ${s.record_count} kayıt`,
      color: s.color, path: `/sources/${s.id}`,
      search: `${s.full_tr} ${s.full_en} ${s.name_ar} ${s.work_tr}`.toLowerCase(),
    });
  });

  // Clusters
  clusters.forEach(cl => {
    items.push({
      type: 'cluster', icon: '🔀', label: `${cl.loc} (${cl.y})`,
      sub: `${cl.cnt} kayıt · ${cl.srcs.length} kaynak`,
      path: '/compare',
      search: `${cl.loc} ${cl.y} cluster küme karşılaştırma`.toLowerCase(),
    });
  });

  // Pages
  [
    { icon: '🗺', label: 'Harita', path: '/map', search: 'harita map' },
    { icon: '📅', label: 'Zaman Çizelgesi', path: '/timeline', search: 'zaman çizelgesi timeline kronoloji' },
    { icon: '🔀', label: 'Perspektif Karşılaştırma', path: '/compare', search: 'karşılaştırma compare perspektif' },
    { icon: 'ℹ️', label: 'Hakkında', path: '/about', search: 'hakkında about metodoloji ekip' },
  ].forEach(p => items.push({ type: 'page', ...p, sub: 'Sayfa' }));

  return items;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const index = useMemo(buildIndex, []);

  const results = useMemo(() => {
    if (!query.trim()) return index.filter(i => i.type === 'page' || i.type === 'source').slice(0, 12);
    const q = query.toLowerCase();
    const words = q.split(/\s+/);
    return index
      .filter(item => words.every(w => item.search.includes(w)))
      .slice(0, 15);
  }, [query, index]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) { setQuery(''); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const go = (item) => {
    setOpen(false);
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) go(results[activeIdx]);
  };

  return (
    <>
      {/* Trigger button in Navbar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gold/10 bg-ink-300/40 text-parchment-faint text-xs hover:border-gold/20 hover:text-parchment-dim transition-colors"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        Ara...
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-ink-200/60 text-[0.6rem] text-parchment-faint font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="cmd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="cmd-box"
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center px-5 border-b border-gold/10">
                <svg className="w-4 h-4 text-parchment-faint flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  className="cmd-input"
                  placeholder="Olay, kale, kaynak, güzergâh ara..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {results.length > 0 && (
                <div className="cmd-results">
                  {results.map((item, i) => (
                    <div
                      key={`${item.type}-${item.label}-${i}`}
                      className={`cmd-item ${i === activeIdx ? 'active' : ''}`}
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIdx(i)}
                    >
                      <div className="icon">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-parchment text-sm truncate">{item.label}</div>
                        <div className="text-parchment-faint text-xs truncate">{item.sub}</div>
                      </div>
                      {item.color && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />}
                    </div>
                  ))}
                </div>
              )}

              {results.length === 0 && query.trim() && (
                <div className="px-5 py-8 text-center text-parchment-faint text-sm">
                  Sonuç bulunamadı
                </div>
              )}

              <div className="px-5 py-2 border-t border-gold/10 flex gap-4 text-[0.6rem] text-parchment-faint">
                <span>↑↓ gezin</span>
                <span>↵ seç</span>
                <span>esc kapat</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
