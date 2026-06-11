// Helpers compartidos entre Mosaico.tsx (cliente) y EventoCard.astro (server)
// para que la grilla y el orden de revelación sean idénticos en ambos lados
// (evita mismatch de hidratación y mantiene coherencia visual).

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSlug(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Dimensiones de la grilla a partir de la "meta de caras" del evento, con
// aspecto ~16:9 y un tope para que el render no se vuelva pesado.
export function dims(meta: number): { cols: number; rows: number; total: number } {
  const rows = Math.max(16, Math.min(28, Math.round(Math.sqrt(meta / 1.78))));
  const cols = Math.round(rows * 1.78);
  return { cols, rows, total: cols * rows };
}

// Orden disperso pero determinista en que se "encienden" las celdas.
export function ordenRevelado(slug: string, total: number): number[] {
  const idx = Array.from({ length: total }, (_, i) => i);
  const rnd = mulberry32(hashSlug(slug));
  for (let k = total - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    const t = idx[k];
    idx[k] = idx[j];
    idx[j] = t;
  }
  return idx;
}
