import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

export const POST: APIRoute = async ({ request }) => {
  const b = await request.json().catch(() => null);
  if (!b?.titulo?.trim()) return json({ error: 'Falta el título.' }, 400);
  const slug = (b.slug?.trim() ? slugify(b.slug) : slugify(b.titulo)) || '';
  if (!slug) return json({ error: 'No pude generar un slug válido.' }, 400);

  const existe = (
    await db.select({ id: schema.eventos.id }).from(schema.eventos).where(eq(schema.eventos.slug, slug)).limit(1)
  )[0];
  if (existe) return json({ error: `Ya existe una misa con el slug "${slug}".` }, 409);

  const [ev] = await db
    .insert(schema.eventos)
    .values({
      slug,
      titulo: String(b.titulo).trim(),
      subtitulo: String(b.subtitulo || ''),
      tipo: ['recital', 'homenaje', 'otro'].includes(b.tipo) ? b.tipo : 'recital',
      fecha: String(b.fecha || ''),
      lugar: String(b.lugar || ''),
      ciudad: String(b.ciudad || ''),
      almasBase: int(b.almasBase),
      reveladoBase: int(b.reveladoBase),
      meta: int(b.meta) || 1400,
      imagenObjetivo: String(b.imagenObjetivo || ''),
      panoramica: String(b.panoramica || ''),
      publicado: b.publicado !== false,
      orden: int(b.orden),
    })
    .returning();

  return json({ ok: true, id: ev.id, slug });
};
