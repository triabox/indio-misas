import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { addFoto } from '@/lib/store';

interface Props {
  slug: string;
  panoramica: string;
  logueado: boolean;
  fotoHabilitada: boolean;
  usuarioAlias?: string;
}

type Paso = 'login' | 'modo' | 'foto' | 'historia' | 'listo';
type Modo = 'foto' | 'recuerdo';

export default function SubirModal({ slug, panoramica, logueado, fotoHabilitada, usuarioAlias = '' }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<Paso>('login');
  const [modo, setModo] = useState<Modo>('recuerdo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [alias, setAlias] = useState('');
  const [historia, setHistoria] = useState('');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [here, setHere] = useState('/');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHere(window.location.pathname);
  }, []);

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  function abrir() {
    setError('');
    setArchivo(null);
    setPreview('');
    setAlias(usuarioAlias);
    setHistoria('');
    setPos(null);
    if (!logueado) setPaso('login');
    else if (fotoHabilitada) setPaso('modo');
    else {
      setModo('recuerdo');
      setPaso('historia');
    }
    setAbierto(true);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const comprimida = await imageCompression(file, {
        maxSizeMB: 0.35,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      setArchivo(comprimida);
      setPreview(URL.createObjectURL(comprimida));
    } catch {
      setError('No se pudo procesar esa imagen. Probá con otra.');
    }
  }

  function onMap(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({
      x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10,
      y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10,
    });
  }

  async function confirmar() {
    const esRecuerdo = modo === 'recuerdo';
    if (!historia.trim()) return;
    if (!esRecuerdo && !archivo) {
      setError('Elegí una foto.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      let imagenKey: string | null = null;
      if (!esRecuerdo && archivo) {
        const up = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ contentType: archivo.type }),
        });
        const updata = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(updata.error || 'No se pudo preparar la subida.');
        const put = await fetch(updata.url, {
          method: 'PUT',
          headers: { 'content-type': archivo.type },
          body: archivo,
        });
        if (!put.ok) throw new Error('No se pudo subir la foto.');
        imagenKey = updata.key;
      }
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventoSlug: slug,
          tipo: modo,
          historia: historia.trim(),
          alias: alias.trim(),
          x: pos?.x,
          y: pos?.y,
          imagenKey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar.');
      addFoto(slug, {
        id: data.id || `vos-${Date.now()}`,
        src: esRecuerdo ? '' : preview,
        alias: (alias.trim() || 'Vos') + ' · vos',
        historia: historia.trim(),
        x: pos ? pos.x : 10 + Math.round(Math.random() * 80),
        y: pos ? pos.y : 25 + Math.round(Math.random() * 55),
        recuerdo: esRecuerdo,
      });
      setPaso('listo');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const stepIdx = paso === 'login' ? 0 : paso === 'modo' || paso === 'foto' ? 1 : 2;
  const nextParam = `?next=${encodeURIComponent(here)}`;

  return (
    <>
      <button className="subir-fab cinta" onClick={abrir}>
        <span className="subir-fab-inner">✋ Dejá tu marca</span>
      </button>

      {abierto && (
        <div className="subir-back" onClick={() => setAbierto(false)}>
          <div className="subir-modal afiche" onClick={(e) => e.stopPropagation()}>
            <button className="mz-close" onClick={() => setAbierto(false)} aria-label="Cerrar">
              ✕
            </button>

            <div className="subir-steps">
              {['Entrar', 'Cómo', 'Tu historia'].map((t, i) => (
                <span key={t} className={`subir-step${stepIdx >= i ? ' on' : ''}`}>
                  {t}
                </span>
              ))}
            </div>

            {paso === 'login' && (
              <div className="subir-body">
                <h3 className="stencil text-3xl titulo-sangre">SUMÁ TU RECUERDO</h3>
                <p className="mt-2 text-sm text-hueso-2/80">
                  Entrá o creá tu cuenta para dejar tu marca en la misa de todos.
                </p>
                <a className="subir-cta subir-cta-link" href={`/entrar${nextParam}`}>
                  Entrar
                </a>
                <a className="subir-link" href={`/registro${nextParam}`}>
                  Crear mi cuenta →
                </a>
              </div>
            )}

            {paso === 'modo' && (
              <div className="subir-body">
                <h3 className="stencil text-2xl text-hueso">¿CÓMO DEJÁS TU MARCA?</h3>
                <p className="mt-1 text-sm text-hueso-2/70">
                  Las dos suman al mosaico del Indio y al contador de almas.
                </p>
                <button
                  className="subir-opcion"
                  onClick={() => {
                    setModo('foto');
                    setPaso('foto');
                  }}
                >
                  <span className="subir-opcion-t">📷 Con mi foto</span>
                  <span className="subir-opcion-d">Subo una foto mía o con mi banda en la multitud.</span>
                </button>
                <button
                  className="subir-opcion"
                  onClick={() => {
                    setModo('recuerdo');
                    setPaso('historia');
                  }}
                >
                  <span className="subir-opcion-t">🕯️ Solo mi recuerdo</span>
                  <span className="subir-opcion-d">
                    No subo foto: dejo mi historia de que estuve. Igual enciendo mi parte.
                  </span>
                </button>
              </div>
            )}

            {paso === 'foto' && (
              <div className="subir-body">
                <h3 className="stencil text-2xl text-hueso">ELEGÍ TU FOTO</h3>
                <p className="mt-1 text-sm text-hueso-2/70">
                  Solo, con amigos o con toda tu banda: la que mejor cuente que estuvieron ahí.
                </p>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
                {preview ? (
                  <button
                    className="subir-preview"
                    style={{ backgroundImage: `url(${preview})` }}
                    onClick={() => fileRef.current?.click()}
                    aria-label="Cambiar foto"
                  >
                    <span className="subir-preview-cambiar">cambiar</span>
                  </button>
                ) : (
                  <button className="subir-elegir" onClick={() => fileRef.current?.click()}>
                    📷 Elegí una foto de tu galería
                  </button>
                )}
                {error && <p className="auth-error">{error}</p>}
                <button className="subir-cta" disabled={!archivo} onClick={() => setPaso('historia')}>
                  Seguir
                </button>
              </div>
            )}

            {paso === 'historia' && (
              <div className="subir-body">
                <h3 className="stencil text-2xl text-hueso">CONTÁ TU HISTORIA</h3>
                {modo === 'recuerdo' && (
                  <p className="mt-1 text-sm text-amarillo-luz/80">
                    Sin foto, pero presente. Tu recuerdo va al muro como una vela y enciende tu
                    parte del mosaico.
                  </p>
                )}
                <input
                  className="subir-input"
                  placeholder="Tu nombre, apodo o el de tu banda"
                  value={alias}
                  maxLength={32}
                  onChange={(e) => setAlias(e.target.value)}
                />
                <textarea
                  className="subir-text"
                  placeholder="¿Qué viviste esa noche? (una o dos líneas)"
                  value={historia}
                  maxLength={140}
                  rows={3}
                  onChange={(e) => setHistoria(e.target.value)}
                />
                <span className="subir-count">{historia.length}/140</span>
                <p className="mt-2 text-xs uppercase tracking-ancho text-hueso-2/60">
                  ¿Dónde estabas? (opcional)
                </p>
                <div className="subir-map" style={{ backgroundImage: `url(${panoramica})` }} onClick={onMap}>
                  {pos && <span className="subir-marker" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />}
                  {!pos && <span className="subir-map-hint">tocá para marcar tu lugar</span>}
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button className="subir-cta" disabled={!historia.trim() || enviando} onClick={confirmar}>
                  {enviando ? 'Sumando...' : 'Sumarme a la misa'}
                </button>
              </div>
            )}

            {paso === 'listo' && (
              <div className="subir-body text-center">
                <div className="subir-pop">{modo === 'recuerdo' ? '🕯️' : '✊'}</div>
                <h3 className="stencil text-3xl titulo-sangre mt-2">¡YA SOS PARTE!</h3>
                <p className="mt-2 text-sm text-hueso-2/80">
                  {modo === 'recuerdo'
                    ? 'Tu recuerdo quedó en el muro como una vela encendida y prendiste tu parte del mosaico. Una alma más: la tuya. Sin foto, pero estuviste.'
                    : 'Tu foto se encendió en el mosaico y tu historia está en el muro. Una banda más en la misa: ya brillás con todos.'}
                </p>
                <button className="subir-cta mt-5" onClick={() => setAbierto(false)}>
                  Ver el mosaico
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
