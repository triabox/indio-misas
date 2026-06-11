import { useEffect, useRef, useState } from 'react';
import { formatNumero } from '@/lib/format';
import { ensureEvento, getSnapshot, subscribe, type Foto } from '@/lib/store';

interface Props {
  valor: number;
  slug?: string;
  fotos?: Foto[];
  label?: string;
  size?: 'sm' | 'lg' | 'xl';
}

const SIZES = {
  sm: 'text-4xl sm:text-5xl',
  lg: 'text-6xl sm:text-7xl',
  xl: 'text-7xl sm:text-8xl lg:text-9xl',
};

export default function ContadorAlmas({ valor, slug, fotos = [], label = 'almas', size = 'lg' }: Props) {
  const [display, setDisplay] = useState(0);
  const [pulse, setPulse] = useState(false);
  const displayRef = useRef(0);
  const targetRef = useRef(valor);
  const rafRef = useRef<number | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  function animateTo(to: number, dur: number) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = displayRef.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const val = from + (to - from) * e;
      displayRef.current = val;
      setDisplay(val);
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (slug) {
      ensureEvento(slug, fotos, valor);
      targetRef.current = getSnapshot(slug).almas;
      const unsub = subscribe(slug, () => {
        const next = getSnapshot(slug).almas;
        targetRef.current = next;
        if (startedRef.current) {
          animateTo(next, 700);
          setPulse(true);
          setTimeout(() => setPulse(false), 650);
        }
      });
      return () => {
        unsub();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          animateTo(targetRef.current, 1700);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={elRef} className="inline-flex flex-col items-center">
      <span
        className={`stencil titulo-sangre tabular-nums transition-transform duration-300 ${SIZES[size]} ${
          pulse ? 'scale-110 text-amarillo-luz' : ''
        }`}
      >
        {formatNumero(display)}
      </span>
      <span className="cond mt-1 text-xs uppercase tracking-ancho text-hueso-2/70 sm:text-sm">
        {label}
      </span>
    </div>
  );
}
