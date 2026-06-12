import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id!;
  const b = await request.json().catch(() => ({}));
  const campos: Record<string, unknown> = {};
  for (const k of ['titulo', 'subtitulo', 'tipo', 'fecha', 'lugar', 'ciudad', 'imagenObjetivo', 'panoramica']) {
    if (k in b) campos[k] = String(b[k] ?? '');
  }
  for (const k of ['almasBase', 'reveladoBase', 'meta', 'orden']) {
    if (k in b) campos[k] = int(b[k]);
  }
  if ('publicado' in b) campos.publicado = !!b.publicado;
  if (!Object.keys(campos).length) return json({ error: 'Nada para actualizar.' }, 400);

  await db.update(schema.eventos).set(campos).where(eq(schema.eventos.id, id));
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params }) => {
  // borra el evento y, por cascade, sus posts y asistencias
  await db.delete(schema.eventos).where(eq(schema.eventos.id, params.id!));
  return json({ ok: true });
};
