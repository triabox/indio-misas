import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { dims, ordenRevelado } from '@/lib/mosaico';
import { formatNumero } from '@/lib/format';
import { ensureEvento, getSnapshot, subscribe, type Foto } from '@/lib/store';

interface Props {
  slug: string;
  imagenObjetivo: string;
  meta: number;
  reveladas: number;
  fotos: Foto[];
  almas: number;
}

interface Celda {
  idx: number;
  col: number;
  row: number;
  rank: number;
  bgPos: string;
  delay: number;
}

const DIM = 'grayscale(1) brightness(0.42)';

const Grilla = memo(function Grilla({
  celdas,
  cols,
  rows,
  img,
  encendidas,
  highlightIdx,
}: {
  celdas: Celda[];
  cols: number;
  rows: number;
  img: string;
  encendidas: number;
  highlightIdx: number;
}) {
  const size = `${cols * 100}% ${rows * 100}%`;
  return (
    <div
      className="mz-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        aspectRatio: `${cols} / ${rows}`,
      }}
    >
      {celdas.map((c) => {
        const lit = c.rank < encendidas;
        return (
          <div
            key={c.idx}
            className={`mz-tile${lit ? ' mz-lit' : ''}${c.idx === highlightIdx ? ' mz-new' : ''}`}
            data-idx={c.idx}
            data-col={c.col}
            data-row={c.row}
            data-rank={c.rank}
            data-lit={lit ? '1' : '0'}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: size,
              backgroundPosition: c.bgPos,
              filter: lit ? 'none' : DIM,
              transition: 'filter 0.6s ease',
              animationDelay: `${c.delay}s`,
            }}
          />
        );
      })}
    </div>
  );
});

export default function Mosaico({ slug, imagenObjetivo, meta, reveladas, fotos, almas }: Props) {
  const { cols, rows, total } = useMemo(() => dims(meta), [meta]);
  const orden = useMemo(() => ordenRevelado(slug, total), [slug, total]);
  const rank = useMemo(() => {
    const r = new Array(total);
    for (let k = 0; k < total; k++) r[orden[k]] = k;
    return r;
  }, [orden, total]);

  const base = Math.min(total, reveladas);

  const [estado, setEstado] = useState(() => ({ fotos, almas }));
  const [hover, setHover] = useState<{ col: number; row: number; rank: number } | null>(null);
  const [lightbox, setLightbox] = useState<Foto | null>(null);
  const [highlight, setHighlight] = useState<{ idx: number; foto: Foto } | null>(null);
  const ultimaRef = useRef<string | null>(null);

  useEffect(() => {
    ensureEvento(slug, fotos, almas);
    setEstado(getSnapshot(slug));
    return subscribe(slug, () => setEstado(getSnapshot(slug)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const nuevas = useMemo(() => estado.fotos.filter((f) => f.nueva).length, [estado.fotos]);
  const encendidas = Math.min(total, base + nuevas);

  const celdas = useMemo<Celda[]>(() => {
    const out: Celda[] = new Array(total);
    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      out[i] = {
        idx: i,
        col,
        row,
        rank: rank[i],
        bgPos: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
        delay: (rank[i] / total) * 0.9,
      };
    }
    return out;
  }, [total, cols, rows, rank]);

  // foto recién subida -> destella en la última celda encendida
  useEffect(() => {
    const f0 = estado.fotos[0];
    if (f0?.nueva && f0.id !== ultimaRef.current && encendidas > 0) {
      ultimaRef.current = f0.id;
      setHighlight({ idx: orden[encendidas - 1], foto: f0 });
      const t = setTimeout(() => setHighlight(null), 4500);
      return () => clearTimeout(t);
    }
  }, [estado.fotos, encendidas, orden]);

  function fotoDeRank(r: number): Foto | undefined {
    if (!estado.fotos.length) return undefined;
    return estado.fotos[((r % estado.fotos.length) + estado.fotos.length) % estado.fotos.length];
  }

  function handleOver(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.dataset.lit === '1') {
      const r = Number(t.dataset.rank);
      if (!hover || hover.rank !== r) {
        setHover({ col: Number(t.dataset.col), row: Number(t.dataset.row), rank: r });
      }
    } else if (hover) {
      setHover(null);
    }
  }

  function handleClick(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.dataset.lit === '1') {
      const foto = fotoDeRank(Number(t.dataset.rank));
      if (foto) setLightbox(foto);
    }
  }

  const hoverFoto = hover ? fotoDeRank(hover.rank) : undefined;
  const tipArriba = hover ? hover.row > rows * 0.28 : true;
  const pct = Math.round((encendidas / total) * 100);
  const completo = encendidas >= total;

  return (
    <div className="relative">
      <div className="mz-glow" aria-hidden="true" />
      <div className="mz-wrap" onMouseMove={handleOver} onMouseLeave={() => setHover(null)} onClick={handleClick}>
        <Grilla celdas={celdas} cols={cols} rows={rows} img={imagenObjetivo} encendidas={encendidas} highlightIdx={highlight?.idx ?? -1} />

        {hover && hoverFoto && (
          <div
            className={`mz-tip ${tipArriba ? 'mz-tip-up' : 'mz-tip-down'}`}
            style={{ left: `${((hover.col + 0.5) / cols) * 100}%`, top: `${(hover.row / rows) * 100}%` }}
          >
            <span className="cond text-amarillo-luz text-[11px] uppercase tracking-ancho">{hoverFoto.alias}</span>
            <span className="block text-[12px] leading-snug text-hueso/90">“{hoverFoto.historia}”</span>
          </div>
        )}

        {highlight && (
          <div
            className="mz-newlabel"
            style={{
              left: `${((highlight.idx % cols) + 0.5) / cols * 100}%`,
              top: `${Math.floor(highlight.idx / cols) / rows * 100}%`,
            }}
          >
            ✋ ¡ya brillás en la misa!
          </div>
        )}
      </div>

      <div className="mz-progress">
        <div className="mz-bar-track">
          <div className="mz-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="cond mt-2 text-center text-[11px] uppercase tracking-ancho text-hueso-2/60">
          {completo ? (
            <span className="text-amarillo-luz">imagen completa · {formatNumero(total)} fotos · todas brillando</span>
          ) : (
            <>
              {formatNumero(encendidas)} de {formatNumero(total)} fotos · {pct}% revelado · tocá una para su historia
            </>
          )}
        </p>
      </div>

      {lightbox && (
        <div className="mz-light" onClick={() => setLightbox(null)}>
          <div className="mz-light-card afiche" onClick={(e) => e.stopPropagation()}>
            {lightbox.recuerdo ? (
              <div className="mz-light-vela">
                <span className="mz-vela-icon">🕯️</span>
                <span className="cond text-xs uppercase tracking-ancho text-amarillo-luz/80">estuvo</span>
              </div>
            ) : (
              <img src={lightbox.src} alt={lightbox.alias} className="mz-light-img no-drag" />
            )}
            <div className="p-4">
              <p className="cond text-amarillo-luz text-sm uppercase tracking-ancho">{lightbox.alias}</p>
              <p className="mt-1 text-hueso/90 leading-relaxed">“{lightbox.historia}”</p>
            </div>
            <button className="mz-close" onClick={() => setLightbox(null)} aria-label="Cerrar">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
