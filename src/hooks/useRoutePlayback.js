import { useState, useRef, useCallback, useEffect } from 'react';
import L from 'leaflet';

const SPEED = 2500; // ms per segment
const PAUSE_AT_STOP = 800; // ms pause at each waypoint

export default function useRoutePlayback(mapInst) {
  const [playing, setPlaying] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [progress, setProgress] = useState({ idx: 0, name: '' });
  const markerRef = useRef(null);
  const animRef = useRef(null);
  const abortRef = useRef(false);

  const cleanup = useCallback(() => {
    abortRef.current = true;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (markerRef.current && mapInst.current) {
      mapInst.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setPlaying(false);
    setActiveRouteId(null);
    setProgress({ idx: 0, name: '' });
  }, [mapInst]);

  const play = useCallback((route) => {
    const map = mapInst.current;
    if (!map || !route || route.wp.length < 2) return;

    cleanup();
    abortRef.current = false;
    setPlaying(true);
    setActiveRouteId(route.id);

    // Create animated marker
    const icon = L.divIcon({
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      html: `<div style="width:20px;height:20px;border-radius:50%;background:${route.col};border:2px solid #d4a848;box-shadow:0 0 16px ${route.col}80, 0 0 32px ${route.col}40;transition:box-shadow 0.3s"></div>`,
    });

    const marker = L.marker([route.wp[0].a, route.wp[0].o], { icon, zIndexOffset: 1000 }).addTo(map);
    markerRef.current = marker;

    // Fit bounds
    const bounds = L.latLngBounds(route.wp.map(w => [w.a, w.o]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7 });

    // Animate through segments
    const animateSegment = (segIdx) => {
      if (abortRef.current || segIdx >= route.wp.length - 1) {
        // End — final pause then cleanup
        setProgress({ idx: route.wp.length - 1, name: route.wp[route.wp.length - 1].n });
        setTimeout(() => {
          if (!abortRef.current) cleanup();
        }, 1500);
        return;
      }

      const from = route.wp[segIdx];
      const to = route.wp[segIdx + 1];
      setProgress({ idx: segIdx, name: from.n });

      // Show popup at waypoint
      marker.bindPopup(
        `<div class="event-popup"><h4 style="color:${route.col}">${segIdx + 1}. ${from.n}</h4></div>`,
        { closeButton: false, offset: [0, -12] }
      ).openPopup();

      // Pause at stop
      setTimeout(() => {
        if (abortRef.current) return;
        marker.closePopup();

        const startTime = performance.now();
        const fromLat = from.a, fromLng = from.o;
        const toLat = to.a, toLng = to.o;

        const step = (now) => {
          if (abortRef.current) return;
          const elapsed = now - startTime;
          const t = Math.min(elapsed / SPEED, 1);

          // Ease in-out
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

          const lat = fromLat + (toLat - fromLat) * ease;
          const lng = fromLng + (toLng - fromLng) * ease;
          marker.setLatLng([lat, lng]);

          if (t < 1) {
            animRef.current = requestAnimationFrame(step);
          } else {
            animateSegment(segIdx + 1);
          }
        };

        animRef.current = requestAnimationFrame(step);
      }, PAUSE_AT_STOP);
    };

    animateSegment(0);
  }, [mapInst, cleanup]);

  useEffect(() => {
    return () => { abortRef.current = true; cleanup(); };
  }, [cleanup]);

  return { playing, activeRouteId, progress, play, stop: cleanup };
}
