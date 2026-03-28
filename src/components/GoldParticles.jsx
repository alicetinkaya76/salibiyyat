import { useRef, useEffect, useCallback } from 'react';

const PARTICLE_COUNT = 80;
const COLORS = ['rgba(212,168,72,0.6)', 'rgba(212,168,72,0.3)', 'rgba(196,184,164,0.25)', 'rgba(255,215,100,0.2)'];

export default function GoldParticles() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  const init = useCallback((w, h) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.15,
      r: Math.random() * 2.5 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.005 + 0.002,
      depth: Math.random() * 0.6 + 0.4, // parallax depth
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      if (particlesRef.current.length === 0) init(rect.width, rect.height);
    }

    resize();
    window.addEventListener('resize', resize);

    function handleMouse(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    }
    canvas.parentElement.addEventListener('mousemove', handleMouse);

    let time = 0;
    function draw() {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      time++;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particlesRef.current.forEach(p => {
        // Mouse parallax offset
        const parallaxX = (mx - 0.5) * 30 * p.depth;
        const parallaxY = (my - 0.5) * 20 * p.depth;

        // Gentle floating
        p.x += p.vx + Math.sin(time * p.speed + p.phase) * 0.15;
        p.y += p.vy + Math.cos(time * p.speed * 0.7 + p.phase) * 0.1;

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }

        // Twinkle alpha
        const twinkle = Math.sin(time * p.speed * 3 + p.phase) * 0.3 + 0.7;
        const drawX = p.x + parallaxX;
        const drawY = p.y + parallaxY;

        // Glow
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,168,72,${p.alpha * twinkle * 0.08})`;
        ctx.fill();

        // Particle
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Faint connecting lines for close particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(a.x + (mx - 0.5) * 30 * a.depth, a.y + (my - 0.5) * 20 * a.depth);
            ctx.lineTo(b.x + (mx - 0.5) * 30 * b.depth, b.y + (my - 0.5) * 20 * b.depth);
            ctx.strokeStyle = `rgba(212,168,72,${0.04 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
