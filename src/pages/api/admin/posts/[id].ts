import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { recomputarAsistencia } from '@/lib/admin.server';
import { deleteObject } from '@/lib/r2';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export const PATCH: APIRoute = async ({ params, request }) => {
  const b = await request.json().catch(() => ({}));
  const estado = b.estado === 'oculto' ? 'oculto' : 'visible';
  const post = (await db.select().from(schema.posts).where(eq(schema.posts.id, params.id!)).limit(1))[0];
  if (!post) return json({ error: 'No existe' }, 404);

  await db.update(schema.posts).set({ estado }).where(eq(schema.posts.id, params.id!));
  if (estado === 'oculto') {
    await recomputarAsistencia(post.eventoId, post.userId);
  } else {
    await db
      .insert(schema.asistencias)
      .values({ eventoId: post.eventoId, userId: post.userId })
      .onConflictDoNothing();
  }
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params }) => {
  const post = (await db.select().from(schema.posts).where(eq(schema.posts.id, params.id!)).limit(1))[0];
  if (!post) return json({ error: 'No existe' }, 404);
  await db.delete(schema.posts).where(eq(schema.posts.id, params.id!));
  await recomputarAsistencia(post.eventoId, post.userId);
  if (post.imagenKey) await deleteObject(post.imagenKey);
  return json({ ok: true });
};
