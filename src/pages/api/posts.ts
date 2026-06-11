import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

function clamp(n: unknown, def: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.min(100, Math.max(0, v));
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: 'Entrá para sumar tu recuerdo.' }, 401);
  if (user.bloqueado) return json({ error: 'Tu cuenta está bloqueada.' }, 403);

  const body = await request.json().catch(() => null);
  if (!body?.eventoSlug || !body?.historia?.trim()) {
    return json({ error: 'Faltan datos.' }, 400);
  }
  const tipo = body.tipo === 'recuerdo' ? 'recuerdo' : 'foto';
  if (tipo === 'foto' && !body.imagenKey) {
    return json({ error: 'Falta la foto.' }, 400);
  }

  const ev = (
    await db.select().from(schema.eventos).where(eq(schema.eventos.slug, body.eventoSlug)).limit(1)
  )[0];
  if (!ev) return json({ error: 'Esa misa no existe.' }, 404);

  const [post] = await db
    .insert(schema.posts)
    .values({
      eventoId: ev.id,
      userId: user.id,
      tipo,
      imagenKey: tipo === 'foto' ? String(body.imagenKey) : null,
      historia: String(body.historia).trim().slice(0, 200),
      alias: String(body.alias || user.alias || user.name || 'Anónimo').slice(0, 60),
      x: clamp(body.x, 50),
      y: clamp(body.y, 50),
    })
    .returning();

  // Una sola alma por persona/evento, aunque suba varios recuerdos.
  await db
    .insert(schema.asistencias)
    .values({ eventoId: ev.id, userId: user.id })
    .onConflictDoNothing();

  return json({ ok: true, id: post.id });
};
