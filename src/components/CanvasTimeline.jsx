import { useRef, useEffect, useState, useCallback } from 'react';
import { SRC_COLORS, SRC_NAMES, EVENT_TYPE_LABELS } from '../data/db';

const LANE_HEIGHT = 50;
const LANE_GAP = 8;
const HEADER_HEIGHT = 40;
const PADDING_X = 60;
const PADDING_Y = 20;
const DOT_RADIUS = 4;
const MIN_YEAR = 1096;
const MAX_YEAR = 1466;

const SOURCE_ORDER = ['IA', 'AS', 'MQ', 'US', 'IS', 'ID'];

export default function CanvasTimeline({ events, sources, filters }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef({
    offsetX: 0, offsetY: 0, scale: 1,
    dragging: false, dragStartX: 0, dragStartY: 0, dragOffsetX: 0, dragOffsetY: 0,
    hoveredEvent: null,
  });
  const [tooltip, setTooltip] = useState(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 400 });
  const rafRef = useRef(null);

  const filteredEvents = events.filter(e => {
    if (e.y === null) return false;
    if (filters.source !== 'all' && e.s !== filters.source) return false;
    if (filters.type !== 'all' && e.t !== filters.type) return false;
    return true;
  });

  const activeSources = SOURCE_ORDER.filter(s => {
    if (filters.source !== 'all') return s === filters.source;
    return filteredEvents.some(e => e.s === s);
  });

  const totalHeight = HEADER_HEIGHT + PADDING_Y + activeSources.length * (LANE_HEIGHT + LANE_GAP);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ w: width, h: Math.max(totalHeight + 60, 350) });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [totalHeight]);

  const yearToX = useCallback((year) => {
    const st = stateRef.current;
    const contentWidth = dimensions.w - PADDING_X * 2;
    const x = PADDING_X + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * contentWidth * st.scale + st.offsetX;
    return x;
  }, [dimensions.w]);

  const xToYear = useCallback((x) => {
    const st = stateRef.current;
    const contentWidth = dimensions.w - PADDING_X * 2;
    const year = MIN_YEAR + ((x - PADDING_X - st.offsetX) / (contentWidth * st.scale)) * (MAX_YEAR - MIN_YEAR);
    return Math.round(year);
  }, [dimensions.w]);

  const laneY = useCallback((srcShort) => {
    const idx = activeSources.indexOf(srcShort);
    if (idx === -1) return -100;
    return HEADER_HEIGHT + PADDING_Y + idx * (LANE_HEIGHT + LANE_GAP) + LANE_HEIGHT / 2;
  }, [activeSources]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = dimensions;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = 'rgba(15,13,10,0.01)';
    ctx.fillRect(0, 0, w, h);

    const st = stateRef.current;

    // Determine visible year range
    const visMinYear = xToYear(0);
    const visMaxYear = xToYear(w);
    const yearSpan = visMaxYear - visMinYear;

    // Draw grid lines
    let gridStep = 100;
    if (yearSpan < 80) gridStep = 5;
    else if (yearSpan < 200) gridStep = 10;
    else if (yearSpan < 400) gridStep = 25;
    else if (yearSpan < 600) gridStep = 50;

    ctx.strokeStyle = 'rgba(212,168,72,0.06)';
    ctx.lineWidth = 0.5;
    ctx.font = '10px "Crimson Pro", serif';
    ctx.fillStyle = 'rgba(138,126,108,0.7)';
    ctx.textAlign = 'center';

    for (let y = Math.ceil(MIN_YEAR / gridStep) * gridStep; y <= MAX_YEAR; y += gridStep) {
      const x = yearToX(y);
      if (x < 20 || x > w - 20) continue;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillText(y.toString(), x, HEADER_HEIGHT - 8);
    }

    // Draw swim lanes
    activeSources.forEach((src, i) => {
      const y = HEADER_HEIGHT + PADDING_Y + i * (LANE_HEIGHT + LANE_GAP);
      // Lane background
      ctx.fillStyle = 'rgba(42,33,24,0.3)';
      ctx.beginPath();
      ctx.roundRect(4, y, w - 8, LANE_HEIGHT, 6);
      ctx.fill();

      // Source label
      ctx.fillStyle = SRC_COLORS[src] || '#888';
      ctx.font = 'bold 11px "Crimson Pro", serif';
      ctx.textAlign = 'left';
      ctx.fillText(SRC_NAMES[src] || src, 8, y + LANE_HEIGHT / 2 + 4);
    });

    // Draw events as dots
    const hovered = st.hoveredEvent;
    filteredEvents.forEach(ev => {
      const x = yearToX(ev.y);
      if (x < -10 || x > w + 10) return;
      const y = laneY(ev.s);
      if (y < 0) return;

      // Jitter within lane to avoid overlap
      const hash = (ev.y * 31 + (ev.l || '').charCodeAt(0)) % 100;
      const jitterY = ((hash / 100) - 0.5) * (LANE_HEIGHT - 16);

      const isHovered = hovered && hovered.n === ev.n && hovered.y === ev.y && hovered.s === ev.s;
      const color = SRC_COLORS[ev.s] || '#888';

      ctx.beginPath();
      ctx.arc(x, y + jitterY, isHovered ? DOT_RADIUS * 2 : (ev.c ? DOT_RADIUS + 1 : DOT_RADIUS), 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#d4a848' : color;
      ctx.globalAlpha = isHovered ? 1 : (ev.c ? 0.9 : 0.6);
      ctx.fill();

      if (ev.c) {
        ctx.strokeStyle = '#d4a848';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    // Mini-map
    const mmW = 120, mmH = 20, mmX = w - mmW - 10, mmY = 8;
    ctx.fillStyle = 'rgba(26,22,18,0.8)';
    ctx.strokeStyle = 'rgba(212,168,72,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mmX, mmY, mmW, mmH, 4);
    ctx.fill();
    ctx.stroke();

    // Visible range indicator
    const vStart = Math.max(0, ((visMinYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * mmW);
    const vEnd = Math.min(mmW, ((visMaxYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * mmW);
    ctx.fillStyle = 'rgba(212,168,72,0.3)';
    ctx.beginPath();
    ctx.roundRect(mmX + vStart, mmY + 2, Math.max(8, vEnd - vStart), mmH - 4, 2);
    ctx.fill();

  }, [dimensions, filteredEvents, activeSources, yearToX, xToYear, laneY]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Event handlers
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const st = stateRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = xToYear(mouseX);

    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    const newScale = Math.max(0.5, Math.min(20, st.scale * delta));

    // Adjust offset to keep year under mouse stable
    const contentWidth = dimensions.w - PADDING_X * 2;
    const newOffsetX = mouseX - PADDING_X - ((yearAtMouse - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * contentWidth * newScale;

    st.scale = newScale;
    st.offsetX = newOffsetX;
  }, [dimensions.w, xToYear]);

  const handleMouseDown = useCallback((e) => {
    const st = stateRef.current;
    st.dragging = true;
    st.dragStartX = e.clientX;
    st.dragStartY = e.clientY;
    st.dragOffsetX = st.offsetX;
    st.dragOffsetY = st.offsetY;
    canvasRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e) => {
    const st = stateRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (st.dragging) {
      st.offsetX = st.dragOffsetX + (e.clientX - st.dragStartX);
      setTooltip(null);
      return;
    }

    // Hit test
    let found = null;
    for (const ev of filteredEvents) {
      const x = yearToX(ev.y);
      if (Math.abs(x - mouseX) > 8) continue;
      const y = laneY(ev.s);
      if (y < 0) continue;
      const hash = (ev.y * 31 + (ev.l || '').charCodeAt(0)) % 100;
      const jitterY = ((hash / 100) - 0.5) * (LANE_HEIGHT - 16);
      if (Math.abs((y + jitterY) - mouseY) < 8) {
        found = ev;
        break;
      }
    }

    st.hoveredEvent = found;
    canvas.style.cursor = found ? 'pointer' : 'grab';

    if (found) {
      setTooltip({
        x: mouseX, y: mouseY,
        title: found.n, year: found.y, source: SRC_NAMES[found.s],
        location: found.l, type: EVENT_TYPE_LABELS[found.t] || found.t,
        color: SRC_COLORS[found.s],
      });
    } else {
      setTooltip(null);
    }
  }, [filteredEvents, yearToX, laneY]);

  const handleMouseUp = useCallback(() => {
    const st = stateRef.current;
    st.dragging = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Keyboard navigation (← → to pan, +/- to zoom)
  useEffect(() => {
    function handleKey(e) {
      const st = stateRef.current;
      const step = 60;
      if (e.key === 'ArrowLeft') { st.offsetX += step; e.preventDefault(); }
      else if (e.key === 'ArrowRight') { st.offsetX -= step; e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') {
        st.scale = Math.min(20, st.scale * 1.2); e.preventDefault();
      } else if (e.key === '-') {
        st.scale = Math.max(0.5, st.scale * 0.83); e.preventDefault();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Export as PNG
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'salibiyyat-timeline.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return (
    <div ref={containerRef} className="relative glass-card overflow-hidden">
      {/* Export button */}
      <button
        onClick={exportPNG}
        className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-ink-100/80 backdrop-blur-md border border-gold/12 text-parchment-faint hover:text-gold hover:border-gold/25 transition-all text-[0.65rem]"
        title="Export as PNG"
      >
        📷 PNG
      </button>
      <canvas
        ref={canvasRef}
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { stateRef.current.dragging = false; setTooltip(null); }}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 bg-ink-100/95 border border-gold/20 rounded-lg px-3 py-2.5 shadow-lg backdrop-blur-md max-w-[220px]"
          style={{ left: Math.min(tooltip.x + 14, containerRef.current?.clientWidth - 240), top: Math.max(tooltip.y - 60, 8) }}
        >
          <div className="text-gold text-xs font-semibold mb-1">{tooltip.title}</div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tooltip.color }} />
            <span className="text-parchment-faint text-[0.65rem]">{tooltip.source}</span>
          </div>
          <div className="text-parchment-faint text-[0.65rem]">{tooltip.year} · {tooltip.location} · {tooltip.type}</div>
        </div>
      )}
    </div>
  );
}
