import { useEffect, useRef, useState } from 'react';
import { ensureEvento, getSnapshot, subscribe, type Foto } from '@/lib/store';

interface Props {
  slug: string;
  src: string;
  fotos: Foto[];
  almas: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const MAX = 4.2;

export default function Panoramica({ slug, src, fotos, almas }: Props) {
  const [estado, setEstado] = useState(() => ({ fotos, almas }));
  const [scale, setScale] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [sel, setSel] = useState<Foto | null>(null);
  const [touched, setTouched] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    ensureEvento(slug, fotos, almas);
    setEstado(getSnapshot(slug));
    return subscribe(slug, () => setEstado(getSnapshot(slug)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function clampOff(o: { x: number; y: number }, s: number) {
    const el = wrapRef.current;
    if (!el) return o;
    const maxX = ((s - 1) * el.clientWidth) / 2;
    const maxY = ((s - 1) * el.clientHeight) / 2;
    return { x: clamp(o.x, -maxX, maxX), y: clamp(o.y, -maxY, maxY) };
  }

  function zoom(delta: number) {
    setTouched(true);
    setScale((s) => {
      const ns = clamp(Math.round((s + delta) * 10) / 10, 1, MAX);
      setOff((o) => clampOff(o, ns));
      return ns;
    });
  }

  function reset() {
    setScale(1);
    setOff({ x: 0, y: 0 });
  }

  function onDown(e: React.PointerEvent) {
    if (scale === 1) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    setOff((o) => clampOff({ x: o.x + dx, y: o.y + dy }, scale));
  }
  function onUp() {
    drag.current = null;
  }

  return (
    <div className="select-none">
      <div
        ref={wrapRef}
        className="pano-wrap"
        style={{ cursor: scale > 1 ? 'grab' : 'default' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onClick={() => setTouched(true)}
      >
        <div
          className="pano-inner"
          style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${scale})` }}
        >
          <img src={src} alt="Panorámica del público" className="pano-img no-drag" draggable={false} />
          {estado.fotos.map((f) => (
            <button
              key={f.id}
              className={`pano-pin${f.nueva ? ' pano-pin-new' : ''}${f.recuerdo ? ' pano-pin-recuerdo' : ''}`}
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (!drag.current?.moved) {
                  setSel(f);
                  setTouched(true);
                }
              }}
              aria-label={`Historia de ${f.alias}`}
            />
          ))}
        </div>

        {!touched && (
          <div className="pano-hint">
            <span className="stencil text-2xl sm:text-3xl text-hueso">ENCONTRATE EN LA MULTITUD</span>
            <span className="cond mt-1 text-xs uppercase tracking-ancho text-hueso-2/70">
              tocá un punto · hacé zoom · arrastrá
            </span>
          </div>
        )}

        <div className="pano-ctrl">
          <button onClick={() => zoom(0.6)} aria-label="Acercar">+</button>
          <button onClick={() => zoom(-0.6)} aria-label="Alejar">−</button>
          <button onClick={reset} aria-label="Reiniciar" className="text-[10px]">RESET</button>
        </div>
      </div>

      {sel && (
        <div className="pano-info afiche">
          <div className="flex items-center gap-3 p-3">
            {sel.recuerdo ? (
              <span className="pano-vela h-14 w-14 flex-none">🕯️</span>
            ) : (
              <img src={sel.src} alt={sel.alias} className="h-14 w-14 flex-none object-cover no-drag" />
            )}
            <div className="min-w-0">
              <p className="cond text-amarillo-luz text-xs uppercase tracking-ancho">{sel.alias}</p>
              <p className="truncate text-sm text-hueso/90">“{sel.historia}”</p>
            </div>
            <button className="ml-auto flex-none text-hueso-2/70 hover:text-sangre-viva" onClick={() => setSel(null)} aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
