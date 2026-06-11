// Server-only: resuelve la imagen-objetivo de un evento. Si existe un archivo
// propio en public/eventos/<slug>.<ext> (las fotos reales con permiso que aporta
// el usuario), usa esa; si no, cae a la imagen libre por defecto.
// Solo se importa desde archivos .astro (se ejecuta en build/SSR), nunca en el
// cliente, así node:fs no entra al bundle del navegador.
import fs from 'node:fs';
import path from 'node:path';

const EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'JPG', 'JPEG', 'PNG'];
const DIR = path.resolve('public/eventos');

export function resolveImagen(slug: string, fallback: string): string {
  for (const ext of EXTS) {
    if (fs.existsSync(path.join(DIR, `${slug}.${ext}`))) {
      return `/eventos/${slug}.${ext}`;
    }
  }
  return fallback;
}
