import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';

export default function EventNetwork({ events, sourceColor, sourceName }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!svgRef.current || !events.length) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 420;

    // Build nodes & links: locations as hub nodes, events as leaf nodes
    const locMap = {};
    events.forEach(ev => {
      if (!locMap[ev.l]) locMap[ev.l] = { id: ev.l, type: 'location', count: 0, events: [] };
      locMap[ev.l].count++;
      locMap[ev.l].events.push(ev);
    });

    const locations = Object.values(locMap).filter(l => l.count >= 2);
    const topLocs = locations.sort((a, b) => b.count - a.count).slice(0, 25);
    const topLocIds = new Set(topLocs.map(l => l.id));

    const nodes = [];
    const links = [];

    topLocs.forEach(loc => {
      nodes.push({ id: `loc_${loc.id}`, label: loc.id, type: 'location', count: loc.count, r: Math.max(8, Math.min(22, loc.count * 1.8)) });
      loc.events.slice(0, 8).forEach((ev, i) => {
        const evId = `ev_${loc.id}_${i}`;
        nodes.push({ id: evId, label: ev.n, type: 'event', year: ev.y, eventType: ev.t, r: 4 });
        links.push({ source: `loc_${loc.id}`, target: evId });
      });
    });

    // Cross-location links (same year events at different locations)
    const yearBuckets = {};
    events.forEach(ev => {
      if (!topLocIds.has(ev.l)) return;
      if (!yearBuckets[ev.y]) yearBuckets[ev.y] = new Set();
      yearBuckets[ev.y].add(ev.l);
    });
    Object.values(yearBuckets).forEach(locs => {
      const arr = [...locs];
      if (arr.length >= 2 && arr.length <= 4) {
        for (let i = 0; i < arr.length - 1; i++) {
          links.push({ source: `loc_${arr[i]}`, target: `loc_${arr[i + 1]}`, type: 'temporal' });
        }
      }
    });

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    // Defs for glow
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow-net');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.type === 'temporal' ? 120 : 40))
      .force('charge', d3.forceManyBody().strength(d => d.type === 'location' ? -200 : -30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.r + 4));

    // Links
    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => d.type === 'temporal' ? 'rgba(212,168,72,0.15)' : 'rgba(212,168,72,0.08)')
      .attr('stroke-width', d => d.type === 'temporal' ? 1.5 : 0.8)
      .attr('stroke-dasharray', d => d.type === 'temporal' ? '4,4' : null);

    // Nodes
    const node = g.append('g').selectAll('circle').data(nodes).join('circle')
      .attr('r', d => d.r)
      .attr('fill', d => d.type === 'location' ? sourceColor : `${sourceColor}88`)
      .attr('stroke', d => d.type === 'location' ? '#d4a848' : 'transparent')
      .attr('stroke-width', d => d.type === 'location' ? 1.5 : 0)
      .attr('opacity', d => d.type === 'location' ? 0.85 : 0.6)
      .attr('cursor', 'pointer')
      .attr('filter', d => d.type === 'location' ? 'url(#glow-net)' : null);

    // Labels for locations
    const labels = g.append('g').selectAll('text').data(nodes.filter(n => n.type === 'location')).join('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('fill', '#c4b8a4')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -d.r - 6)
      .attr('font-family', '"Crimson Pro", serif')
      .attr('pointer-events', 'none');

    // Drag
    node.call(d3.drag()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    // Hover
    node.on('mouseenter', (event, d) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (d.type === 'event') {
        setTooltip({ x, y, label: d.label, year: d.year, type: d.eventType });
      } else {
        setTooltip({ x, y, label: d.label, count: d.count });
      }
      d3.select(event.target).attr('opacity', 1).attr('stroke', '#d4a848').attr('stroke-width', 2);
      // Highlight connected
      link.attr('stroke', l => (l.source.id === d.id || l.target.id === d.id) ? 'rgba(212,168,72,0.5)' : 'rgba(212,168,72,0.04)');
    })
    .on('mouseleave', (event, d) => {
      setTooltip(null);
      if (selectedNode !== d.id) {
        d3.select(event.target)
          .attr('opacity', d.type === 'location' ? 0.85 : 0.6)
          .attr('stroke', d.type === 'location' ? '#d4a848' : 'transparent')
          .attr('stroke-width', d.type === 'location' ? 1.5 : 0);
        link.attr('stroke', l => l.type === 'temporal' ? 'rgba(212,168,72,0.15)' : 'rgba(212,168,72,0.08)');
      }
    })
    .on('click', (event, d) => {
      event.stopPropagation();
      // Zoom to clicked node
      const scale = 2.5;
      const transform = d3.zoomIdentity
        .translate(width / 2 - d.x * scale, height / 2 - d.y * scale)
        .scale(scale);
      svg.transition().duration(600).call(zoom.transform, transform);
      setSelectedNode(d.id);
      // Highlight path: show all connections from this node
      node.attr('opacity', n => {
        if (n.id === d.id) return 1;
        const connected = links.some(l => 
          (l.source.id === d.id && l.target.id === n.id) || 
          (l.target.id === d.id && l.source.id === n.id)
        );
        return connected ? 0.85 : 0.15;
      });
      link.attr('stroke', l => (l.source.id === d.id || l.target.id === d.id) ? 'rgba(212,168,72,0.6)' : 'rgba(212,168,72,0.02)')
        .attr('stroke-width', l => (l.source.id === d.id || l.target.id === d.id) ? 2 : 0.5);
    });

    // Click on SVG background to reset
    svg.on('click', () => {
      setSelectedNode(null);
      node.attr('opacity', d => d.type === 'location' ? 0.85 : 0.6);
      link.attr('stroke', l => l.type === 'temporal' ? 'rgba(212,168,72,0.15)' : 'rgba(212,168,72,0.08)')
        .attr('stroke-width', l => l.type === 'temporal' ? 1.5 : 0.8);
      svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
    });

    // Tick
    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('cx', d => d.x).attr('cy', d => d.y);
      labels.attr('x', d => d.x).attr('y', d => d.y);
    });

    return () => simulation.stop();
  }, [events, sourceColor]);

  if (!events.length) return null;

  return (
    <div ref={containerRef} className="relative glass-card overflow-hidden" style={{ cursor: 'grab' }}>
      <svg ref={svgRef} className="w-full" style={{ height: 420 }} />

      {/* Legend toggle */}
      <button
        onClick={() => setShowLegend(!showLegend)}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg bg-ink-100/80 backdrop-blur-md border border-gold/12 flex items-center justify-center text-parchment-faint hover:text-gold hover:border-gold/25 transition-all text-xs"
        title={t('source_detail.network_legend')}
      >
        ?
      </button>

      {/* Legend panel */}
      {showLegend && (
        <div className="absolute top-12 right-3 z-10 bg-ink-100/95 backdrop-blur-xl border border-gold/15 rounded-lg p-3 shadow-lg max-w-[180px]">
          <h5 className="text-gold text-[0.65rem] uppercase tracking-widest font-semibold mb-2">{t('source_detail.network_legend')}</h5>
          <div className="space-y-2 text-[0.65rem]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-gold flex-shrink-0" style={{ background: sourceColor, opacity: 0.85 }} />
              <span className="text-parchment-faint">{t('source_detail.network_hub')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `${sourceColor}88` }} />
              <span className="text-parchment-faint">{t('source_detail.network_leaf')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0 border-t border-dashed border-gold/40 flex-shrink-0" />
              <span className="text-parchment-faint">{t('source_detail.network_temporal')}</span>
            </div>
          </div>
          <p className="text-parchment-faint text-[0.6rem] mt-2 pt-2 border-t border-gold/10 italic">
            Click node to zoom · Click bg to reset
          </p>
        </div>
      )}

      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-ink-100/95 border border-gold/20 rounded-lg px-3 py-2 text-xs shadow-lg backdrop-blur-md"
          style={{ left: Math.min(tooltip.x + 12, containerRef.current?.clientWidth - 200), top: tooltip.y - 8 }}
        >
          <div className="text-gold font-medium">{tooltip.label}</div>
          {tooltip.year && <div className="text-parchment-faint">{tooltip.year} · {tooltip.type}</div>}
          {tooltip.count && <div className="text-parchment-faint">{tooltip.count} olay</div>}
        </div>
      )}
    </div>
  );
}
