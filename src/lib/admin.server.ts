// Consultas y helpers solo para el panel admin (server-only).
import { eq, and, desc, count } from 'drizzle-orm';
import { db, schema } from './db';
import { urlDeImagen } from './eventos.server';

const { eventos, posts, asistencias, user } = schema;

export async function listarEventosAdmin() {
  const evs = await db.select().from(eventos).orderBy(eventos.orden);
  const ap = await db
    .select({ eventoId: asistencias.eventoId, n: count() })
    .from(asistencias)
    .groupBy(asistencias.eventoId);
  const pp = await db
    .select({ eventoId: posts.eventoId, n: count() })
    .from(posts)
    .where(eq(posts.estado, 'visible'))
    .groupBy(posts.eventoId);
  const amap = new Map(ap.map((x) => [x.eventoId, Number(x.n)]));
  const pmap = new Map(pp.map((x) => [x.eventoId, Number(x.n)]));
  return evs.map((e) => ({ ...e, asistencias: amap.get(e.id) ?? 0, posts: pmap.get(e.id) ?? 0 }));
}

export async function getEventoAdmin(id: string) {
  return (await db.select().from(eventos).where(eq(eventos.id, id)).limit(1))[0] || null;
}

export async function listarPostsAdmin(limit = 120) {
  const filas = await db
    .select({
      id: posts.id,
      tipo: posts.tipo,
      historia: posts.historia,
      imagenKey: posts.imagenKey,
      estado: posts.estado,
      alias: posts.alias,
      userId: posts.userId,
      userEmail: user.email,
      eventoTitulo: eventos.titulo,
    })
    .from(posts)
    .innerJoin(eventos, eq(posts.eventoId, eventos.id))
    .innerJoin(user, eq(posts.userId, user.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
  return filas.map((f) => ({ ...f, src: urlDeImagen(f.imagenKey) }));
}

export async function listarUsuarios() {
  const us = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      alias: user.alias,
      rol: user.rol,
      bloqueado: user.bloqueado,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
  const pp = await db.select({ userId: posts.userId, n: count() }).from(posts).groupBy(posts.userId);
  const pmap = new Map(pp.map((x) => [x.userId, Number(x.n)]));
  return us.map((u) => ({ ...u, posts: pmap.get(u.id) ?? 0 }));
}

// Si al usuario no le quedan posts visibles en el evento, se le quita la asistencia (alma).
export async function recomputarAsistencia(eventoId: string, userId: string) {
  const r = await db
    .select({ n: count() })
    .from(posts)
    .where(and(eq(posts.eventoId, eventoId), eq(posts.userId, userId), eq(posts.estado, 'visible')));
  if (Number(r[0]?.n ?? 0) === 0) {
    await db
      .delete(asistencias)
      .where(and(eq(asistencias.eventoId, eventoId), eq(asistencias.userId, userId)));
  }
}
