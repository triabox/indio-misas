import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

// Importación masiva de misas desde un JSON: { eventos: [...] } o un array directo.
// Por defecto NO pisa las que ya existen (por slug); con sobreescribir:true las actualiza.
// Cada evento acepta `revelado` (0-100 %) que se convierte a reveladoBase = revelado% de meta.
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const lista = Array.isArray(body) ? body : body?.eventos;
  if (!Array.isArray(lista)) return json({ error: 'Esperaba { "eventos": [...] } o un array.' }, 400);
  if (lista.length > 500) return json({ error: 'Máximo 500 misas por importación.' }, 400);
  const sobre = body?.sobreescribir === true;

  const existentes = new Set(
    (await db.select({ slug: schema.eventos.slug }).from(schema.eventos)).map((r) => r.slug),
  );

  let creados = 0;
  let actualizados = 0;
  let salteados = 0;
  const errores: string[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < lista.length; i++) {
    const e = lista[i] ?? {};
    const titulo = String(e.titulo ?? '').trim();
    if (!titulo) {
      errores.push(`#${i + 1}: falta el título`);
      continue;
    }
    const slug = (e.slug ? slugify(String(e.slug)) : slugify(titulo)) || '';
    if (!slug) {
      errores.push(`#${i + 1} (${titulo}): no pude generar un slug`);
      continue;
    }
    if (vistos.has(slug)) {
      errores.push(`#${i + 1} (${slug}): repetido dentro del archivo`);
      continue;
    }
    vistos.add(slug);

    const meta = int(e.meta) || 1500;
    let reveladoBase = int(e.reveladoBase);
    if (e.revelado != null) reveladoBase = Math.round((clamp(int(e.revelado), 0, 100) / 100) * meta);

    const vals = {
      slug,
      titulo,
      subtitulo: String(e.subtitulo ?? ''),
      tipo: ['recital', 'homenaje', 'otro'].includes(e.tipo) ? e.tipo : 'recital',
      fecha: String(e.fecha ?? ''),
      lugar: String(e.lugar ?? ''),
      ciudad: String(e.ciudad ?? ''),
      almasBase: int(e.almasBase),
      reveladoBase,
      meta,
      imagenObjetivo: String(e.imagenObjetivo ?? ''),
      panoramica: String(e.panoramica ?? ''),
      publicado: e.publicado !== false,
      orden: int(e.orden),
    };

    try {
      if (existentes.has(slug)) {
        if (sobre) {
          const { slug: _omit, ...set } = vals;
          await db.update(schema.eventos).set(set).where(eq(schema.eventos.slug, slug));
          actualizados++;
        } else {
          salteados++;
        }
      } else {
        await db.insert(schema.eventos).values(vals);
        existentes.add(slug);
        creados++;
      }
    } catch (err) {
      errores.push(`#${i + 1} (${slug}): ${(err as Error).message}`);
    }
  }

  return json({ ok: true, total: lista.length, creados, actualizados, salteados, errores });
};
