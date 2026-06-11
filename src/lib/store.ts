// Store mínimo compartido entre islas React de una misma página de evento.
// Cada isla de Astro se bundlea por separado, así que para garantizar UNA sola
// fuente de verdad (que "Subí tu foto" actualice en vivo el mosaico, el muro, la
// panorámica y el contador) anclamos el estado a globalThis. Es 100% en memoria
// (prototipo): al recargar se pierde lo agregado.

export interface Foto {
  id: string;
  src: string;
  alias: string;
  historia: string;
  x: number; // 0..100 posición horizontal en la panorámica
  y: number; // 0..100 posición vertical
  nueva?: boolean; // recién subida en esta sesión
  recuerdo?: boolean; // sin foto: dejó solo su recuerdo de que estuvo
}

interface EstadoEvento {
  fotos: Foto[];
  almas: number;
}

interface Backing {
  estado: Record<string, EstadoEvento>;
  listeners: Record<string, Set<() => void>>;
}

const g = globalThis as unknown as { __misasStore?: Backing };
const store: Backing = (g.__misasStore ??= { estado: {}, listeners: {} });

export function ensureEvento(slug: string, fotos: Foto[], almas: number): void {
  if (!store.estado[slug]) {
    store.estado[slug] = { fotos, almas };
  }
}

export function getSnapshot(slug: string): EstadoEvento {
  return store.estado[slug] ?? { fotos: [], almas: 0 };
}

export function subscribe(slug: string, cb: () => void): () => void {
  (store.listeners[slug] ??= new Set()).add(cb);
  return () => {
    store.listeners[slug]?.delete(cb);
  };
}

function emit(slug: string): void {
  store.listeners[slug]?.forEach((cb) => cb());
}

export function addFoto(slug: string, foto: Foto): void {
  const actual = store.estado[slug] ?? { fotos: [], almas: 0 };
  store.estado[slug] = {
    fotos: [{ ...foto, nueva: true }, ...actual.fotos],
    almas: actual.almas + 1,
  };
  emit(slug);
}
