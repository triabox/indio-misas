import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const id = params.id!;
  const b = await request.json().catch(() => ({}));

  if ('bloqueado' in b) {
    const bloqueado = !!b.bloqueado;
    // No te bloquees a vos mismo.
    if (bloqueado && locals.user?.id === id) return json({ error: 'No podés bloquearte a vos.' }, 400);
    await db.update(schema.user).set({ bloqueado }).where(eq(schema.user.id, id));
    if (bloqueado) {
      // Oculta sus posts y le quita las almas.
      await db.update(schema.posts).set({ estado: 'oculto' }).where(eq(schema.posts.userId, id));
      await db.delete(schema.asistencias).where(eq(schema.asistencias.userId, id));
    } else {
      // Al desbloquear: vuelve a mostrar sus posts y recrea una asistencia por evento.
      await db.update(schema.posts).set({ estado: 'visible' }).where(eq(schema.posts.userId, id));
      const evs = await db
        .selectDistinct({ eventoId: schema.posts.eventoId })
        .from(schema.posts)
        .where(and(eq(schema.posts.userId, id), eq(schema.posts.estado, 'visible')));
      for (const e of evs) {
        await db.insert(schema.asistencias).values({ eventoId: e.eventoId, userId: id }).onConflictDoNothing();
      }
    }
  }

  if (b.rol === 'admin' || b.rol === 'user') {
    if (b.rol === 'user' && locals.user?.id === id) return json({ error: 'No te saques admin a vos.' }, 400);
    await db.update(schema.user).set({ rol: b.rol }).where(eq(schema.user.id, id));
  }

  return json({ ok: true });
};
