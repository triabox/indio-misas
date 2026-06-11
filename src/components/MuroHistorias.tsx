import { useEffect, useState } from 'react';
import { ensureEvento, getSnapshot, subscribe, type Foto } from '@/lib/store';

interface Props {
  slug: string;
  fotos: Foto[];
  almas: number;
}

export default function MuroHistorias({ slug, fotos, almas }: Props) {
  const [estado, setEstado] = useState(() => ({ fotos, almas }));

  useEffect(() => {
    ensureEvento(slug, fotos, almas);
    setEstado(getSnapshot(slug));
    return subscribe(slug, () => setEstado(getSnapshot(slug)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <div className="muro-cols">
      {estado.fotos.map((f) => (
        <figure
          key={f.id}
          className={`muro-card afiche${f.nueva ? ' muro-new animate-fadeUp' : ''}`}
        >
          {f.nueva && <span className="muro-ribbon">recién llegada</span>}
          {f.recuerdo ? (
            <div className="muro-vela">
              <span className="muro-vela-icon">🕯️</span>
              <span className="muro-vela-txt">estuvo, sin foto</span>
            </div>
          ) : (
            <img src={f.src} alt={f.alias} loading="lazy" className="muro-img no-drag" />
          )}
          <figcaption className="p-3">
            <p className="cond text-amarillo-luz text-[11px] uppercase tracking-ancho">{f.alias}</p>
            <p className="mt-1 text-sm leading-snug text-hueso/90">“{f.historia}”</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
