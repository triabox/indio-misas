import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

export interface EventoEdit {
  id?: string;
  slug?: string;
  titulo: string;
  subtitulo: string;
  tipo: string;
  fecha: string;
  lugar: string;
  ciudad: string;
  almasBase: number;
  reveladoBase: number;
  meta: number;
  imagenObjetivo: string;
  panoramica: string;
  publicado: boolean;
  orden: number;
}

const VACIO: EventoEdit = {
  titulo: '', subtitulo: '', tipo: 'recital', fecha: '', lugar: '', ciudad: '',
  almasBase: 0, reveladoBase: 0, meta: 1400, imagenObjetivo: '', panoramica: '', publicado: true, orden: 0,
};

export default function EventoForm({ evento }: { evento?: EventoEdit }) {
  const editar = !!evento?.id;
  const [f, setF] = useState<EventoEdit>(evento ?? VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const objRef = useRef<HTMLInputElement>(null);
  const panoRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof EventoEdit, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function subir(file: File, campo: 'imagenObjetivo' | 'panoramica') {
    try {
      const c = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true });
      const up = await fetch('/api/upload', { method: 'POST', headers: { 'content-type': c.type }, body: c });
      const d = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(d.error || 'No se pudo subir.');
      set(campo, `/api/img/${d.key}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const res = await fetch(editar ? `/api/admin/eventos/${evento!.id}` : '/api/admin/eventos', {
        method: editar ? 'PATCH' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'No se pudo guardar.');
      window.location.href = '/admin/misas';
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!confirm('¿Borrar la misa y TODOS sus posts? No se puede deshacer.')) return;
    await fetch(`/api/admin/eventos/${evento!.id}`, { method: 'DELETE' });
    window.location.href = '/admin/misas';
  }

  return (
    <form onSubmit={guardar} className="admin-form">
      <label>Título<input className="subir-input" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} required /></label>
      {!editar && (
        <label>Slug (opcional, se genera del título)<input className="subir-input" value={f.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="ej: olavarria-2017" /></label>
      )}
      <label>Subtítulo<input className="subir-input" value={f.subtitulo} onChange={(e) => set('subtitulo', e.target.value)} /></label>
      <div className="admin-row">
        <label>Tipo
          <select className="subir-input" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
            <option value="recital">Recital</option>
            <option value="homenaje">Homenaje</option>
            <option value="otro">Encuentro</option>
          </select>
        </label>
        <label>Fecha<input className="subir-input" value={f.fecha} onChange={(e) => set('fecha', e.target.value)} placeholder="Marzo 2017" /></label>
      </div>
      <div className="admin-row">
        <label>Lugar<input className="subir-input" value={f.lugar} onChange={(e) => set('lugar', e.target.value)} /></label>
        <label>Ciudad<input className="subir-input" value={f.ciudad} onChange={(e) => set('ciudad', e.target.value)} /></label>
      </div>
      <div className="admin-row">
        <label>Almas base<input type="number" className="subir-input" value={f.almasBase} onChange={(e) => set('almasBase', +e.target.value)} /></label>
        <label>Revelado base<input type="number" className="subir-input" value={f.reveladoBase} onChange={(e) => set('reveladoBase', +e.target.value)} /></label>
      </div>
      <div className="admin-row">
        <label>Meta (caras)<input type="number" className="subir-input" value={f.meta} onChange={(e) => set('meta', +e.target.value)} /></label>
        <label>Orden<input type="number" className="subir-input" value={f.orden} onChange={(e) => set('orden', +e.target.value)} /></label>
      </div>

      <label>Imagen objetivo (URL o subila)
        <input className="subir-input" value={f.imagenObjetivo} onChange={(e) => set('imagenObjetivo', e.target.value)} placeholder="https://… o /api/img/…" />
        <input ref={objRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && subir(e.target.files[0], 'imagenObjetivo')} />
        <button type="button" className="admin-mini" onClick={() => objRef.current?.click()}>subir archivo</button>
      </label>
      <label>Panorámica (URL o subila)
        <input className="subir-input" value={f.panoramica} onChange={(e) => set('panoramica', e.target.value)} placeholder="https://… o /api/img/…" />
        <input ref={panoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && subir(e.target.files[0], 'panoramica')} />
        <button type="button" className="admin-mini" onClick={() => panoRef.current?.click()}>subir archivo</button>
      </label>

      <label className="admin-check">
        <input type="checkbox" checked={f.publicado} onChange={(e) => set('publicado', e.target.checked)} /> Publicada (visible en el sitio)
      </label>

      {error && <p className="auth-error">{error}</p>}
      <div className="admin-acciones">
        <button className="subir-cta" disabled={guardando}>{guardando ? 'Guardando...' : editar ? 'Guardar cambios' : 'Crear misa'}</button>
        {editar && <button type="button" className="admin-borrar" onClick={borrar}>Borrar misa</button>}
      </div>
    </form>
  );
}
