import type { APIRoute } from 'astro';
import { and, count, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: 'No autenticado' }, 401);

  const id = params.id;
  const post = (await db.select().from(schema.posts).where(eq(schema.posts.id, id!)).limit(1))[0];
  if (!post || post.userId !== user.id) return json({ error: 'No encontrado' }, 404);

  await db.delete(schema.posts).where(eq(schema.posts.id, id!));

  // Si ya no le queda ningún post en ese evento, se le quita el alma (asistencia).
  const rest = await db
    .select({ n: count() })
    .from(schema.posts)
    .where(and(eq(schema.posts.eventoId, post.eventoId), eq(schema.posts.userId, user.id)));
  if (Number(rest[0]?.n ?? 0) === 0) {
    await db
      .delete(schema.asistencias)
      .where(and(eq(schema.asistencias.eventoId, post.eventoId), eq(schema.asistencias.userId, user.id)));
  }

  return json({ ok: true });
};
