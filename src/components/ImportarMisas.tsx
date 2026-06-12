import { useState } from 'react';

interface Resultado {
  total: number;
  creados: number;
  actualizados: number;
  salteados: number;
  errores: string[];
}

const EJEMPLO = `{
  "eventos": [
    {
      "titulo": "Huracán 1994",
      "subtitulo": "La vuelta al estadio grande",
      "fecha": "Diciembre 1994",
      "lugar": "Estadio Tomás A. Ducó",
      "ciudad": "Buenos Aires",
      "almasBase": 55000,
      "revelado": 45,
      "imagenObjetivo": "https://…/foto.jpg"
    }
  ]
}`;

export default function ImportarMisas() {
  const [texto, setTexto] = useState('');
  const [sobre, setSobre] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Resultado | null>(null);
  const [error, setError] = useState('');

  async function cargarRecitales() {
    setError('');
    try {
      const r = await fetch('/recitales.json');
      if (!r.ok) throw new Error();
      setTexto(JSON.stringify(await r.json(), null, 2));
    } catch {
      setError('No pude cargar /recitales.json.');
    }
  }

  function leerArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => setTexto(String(fr.result ?? ''));
    fr.readAsText(file);
  }

  async function importar() {
    setError('');
    setRes(null);
    let payload: unknown;
    try {
      payload = JSON.parse(texto);
    } catch {
      setError('El JSON no es válido. Revisá comas, comillas y llaves.');
      return;
    }
    const body = Array.isArray(payload) ? { eventos: payload } : (payload as Record<string, unknown>);
    body.sobreescribir = sobre;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/eventos/importar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Falló la importación.');
      setRes(j as Resultado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="importar">
      <div className="importar-acc">
        <button type="button" className="admin-mini" onClick={cargarRecitales}>
          ⬇ cargar recitales (1994–2017)
        </button>
        <label className="admin-mini importar-file">
          subir .json
          <input type="file" accept="application/json,.json" hidden onChange={leerArchivo} />
        </label>
        <a className="admin-mini" href="/recitales.json" download>
          descargar ejemplo
        </a>
      </div>

      <textarea
        className="importar-text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={EJEMPLO}
        spellCheck={false}
      />

      <label className="admin-check">
        <input type="checkbox" checked={sobre} onChange={(e) => setSobre(e.target.checked)} />
        Sobreescribir las misas que ya existen (por slug)
      </label>

      {error && <p className="auth-error">{error}</p>}

      {res && (
        <div className="importar-res">
          <p>
            <strong className="text-amarillo-luz">{res.creados}</strong> creadas ·{' '}
            <strong className="text-amarillo-luz">{res.actualizados}</strong> actualizadas ·{' '}
            <strong>{res.salteados}</strong> salteadas (ya existían)
          </p>
          {res.errores.length > 0 && (
            <ul className="importar-errores">
              {res.errores.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
          <a className="subir-cta subir-cta-link" href="/admin/misas">
            Ver las misas →
          </a>
        </div>
      )}

      <button className="subir-cta" disabled={busy || !texto.trim()} onClick={importar}>
        {busy ? 'Importando…' : 'Importar misas'}
      </button>
    </div>
  );
}
