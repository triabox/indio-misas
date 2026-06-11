// Siluetas procedurales para el fotomosaico. Devuelven una grilla de brillo
// (row-major, valores 0..1). Las celdas "encendidas" (brillo alto) dibujan la
// figura y se llenan con fotos del público; las oscuras quedan en penumbra.
// Imágenes genéricas a propósito (no retratos reales): puño, figura con micrófono,
// corazón, estrella.

export type Silueta = 'cantante' | 'mano' | 'corazon' | 'estrella';

interface Pt {
  x: number;
  y: number;
}

function inCircle(p: Pt, cx: number, cy: number, r: number): boolean {
  return Math.hypot(p.x - cx, p.y - cy) <= r;
}

function inRoundRect(p: Pt, cx: number, cy: number, hw: number, hh: number, r: number): boolean {
  const dx = Math.abs(p.x - cx) - (hw - r);
  const dy = Math.abs(p.y - cy) - (hh - r);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  return outside + inside <= r;
}

function distSegment(p: Pt, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby || 1e-6;
  let t = ((p.x - ax) * abx + (p.y - ay) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (ax + t * abx), p.y - (ay + t * aby));
}

function insideCantante(u: number, v: number): boolean {
  const p = { x: u, y: v };
  if (inCircle(p, 0.46, 0.19, 0.105)) return true; // cabeza
  if (inRoundRect(p, 0.46, 0.29, 0.04, 0.045, 0.02)) return true; // cuello
  if (v >= 0.3 && v <= 1.0) {
    // torso que se ensancha hacia abajo (hombros -> base)
    const t = (v - 0.3) / 0.7;
    if (Math.abs(u - 0.46) <= 0.115 + t * 0.17) return true;
  }
  if (distSegment(p, 0.57, 0.35, 0.75, 0.13) <= 0.045) return true; // brazo en alto
  if (inCircle(p, 0.77, 0.11, 0.05)) return true; // micrófono / puño
  return false;
}

function insidePuno(u: number, v: number): boolean {
  const p = { x: u, y: v };
  if (inRoundRect(p, 0.5, 0.73, 0.085, 0.25, 0.05)) return true; // antebrazo
  if (inRoundRect(p, 0.5, 0.4, 0.16, 0.15, 0.05)) return true; // puño
  for (const cx of [0.41, 0.5, 0.59]) {
    if (inCircle(p, cx, 0.27, 0.045)) return true; // nudillos
  }
  if (inCircle(p, 0.35, 0.42, 0.05)) return true; // pulgar
  return false;
}

function insideCorazon(u: number, v: number): boolean {
  const x = (u - 0.5) * 2.6;
  const y = (0.58 - v) * 2.6;
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

function insideEstrella(u: number, v: number): boolean {
  const dx = u - 0.5;
  const dy = v - 0.46;
  const r = Math.hypot(dx, dy);
  let ang = Math.atan2(dy, dx) + Math.PI / 2; // punta hacia arriba
  ang = ((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const seg = Math.PI / 5;
  const f = Math.abs((ang % (2 * seg)) - seg) / seg;
  return r <= 0.18 + (0.42 - 0.18) * f;
}

function tester(tipo: Silueta): (u: number, v: number) => boolean {
  switch (tipo) {
    case 'cantante':
      return insideCantante;
    case 'mano':
      return insidePuno;
    case 'corazon':
      return insideCorazon;
    case 'estrella':
      return insideEstrella;
  }
}

const SS = [0.25, 0.75]; // supersampling 2x2 para suavizar el borde

export function brightnessGrid(tipo: Silueta, cols: number, rows: number): number[] {
  const inside = tester(tipo);
  const out: number[] = new Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let hits = 0;
      for (const sx of SS) {
        for (const sy of SS) {
          if (inside((c + sx) / cols, (r + sy) / rows)) hits++;
        }
      }
      out[r * cols + c] = hits / 4;
    }
  }
  return out;
}
