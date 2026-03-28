import { useState, useEffect } from 'react';
import { useInView } from '../hooks/useInView';

export default function AnimatedCounter({ end, duration = 1500, label, suffix = '' }) {
  const [ref, isInView] = useInView();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <div ref={ref} className="group glass-card p-5 text-center min-w-[90px] cursor-default animate-glow-pulse">
      <span className="block text-3xl font-bold text-gold tabular-nums leading-none">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="block text-[0.7rem] text-parchment-faint uppercase tracking-widest mt-2">
        {label}
      </span>
    </div>
  );
}
