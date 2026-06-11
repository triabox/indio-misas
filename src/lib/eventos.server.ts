// Capa de lectura (solo server). Lee eventos y posts reales de la DB y calcula
// `almas` (convocatoria + asistencias reales) y `reveladas` (celdas encendidas).
import { eq, and, desc, count } from 'drizzle-orm';
import { db, schema } from './db';
import type { Foto } from './store';

const { eventos, posts, asistencias } = schema;

export type EventoRow = typeof eventos.$inferSelect;
export interface EventoVM extends EventoRow {
  almas: number;
  reveladas: number;
}

export function urlDeImagen(key: string | null | undefined): string {
  if (!key) return '';
  if (key.startsWith('http')) return key; // URL directa (imágenes libres / legacy)
  const base = process.env.PUBLIC_R2_URL ?? '';
  return `${base.replace(/\/$/, '')}/${key}`;
}

async function asistenciasPorEvento(): Promise<Map<string, number>> {
  const filas = await db
    .select({ eventoId: asistencias.eventoId, n: count() })
    .from(asistencias)
    .groupBy(asistencias.eventoId);
  return new Map(filas.map((f) => [f.eventoId, Number(f.n)]));
}

export async function listarEventos(): Promise<EventoVM[]> {
  const filas = await db
    .select()
    .from(eventos)
    .where(eq(eventos.publicado, true))
    .orderBy(eventos.orden);
  const conteo = await asistenciasPorEvento();
  return filas.map((e) => {
    const n = conteo.get(e.id) ?? 0;
    return { ...e, almas: e.almasBase + n, reveladas: e.reveladoBase + n };
  });
}

export async function almasGlobales(): Promise<number> {
  const evs = await listarEventos();
  return evs.reduce((acc, e) => acc + e.almas, 0);
}

export interface EventoDetalle {
  evento: EventoVM;
  fotos: Foto[];
}

export async function getEventoConPosts(slug: string): Promise<EventoDetalle | null> {
  const fila = (await db.select().from(eventos).where(eq(eventos.slug, slug)).limit(1))[0];
  if (!fila) return null;
  const ps = await db
    .select()
    .from(posts)
    .where(and(eq(posts.eventoId, fila.id), eq(posts.estado, 'visible')))
    .orderBy(desc(posts.createdAt));
  const r = await db
    .select({ n: count() })
    .from(asistencias)
    .where(eq(asistencias.eventoId, fila.id));
  const n = Number(r[0]?.n ?? 0);
  const fotos: Foto[] = ps.map((p) => ({
    id: p.id,
    src: urlDeImagen(p.imagenKey),
    alias: p.alias,
    historia: p.historia,
    x: p.x,
    y: p.y,
    recuerdo: p.tipo === 'recuerdo',
  }));
  return {
    evento: { ...fila, almas: fila.almasBase + n, reveladas: fila.reveladoBase + n },
    fotos,
  };
}

export interface GrupoRecuerdos {
  slug: string;
  titulo: string;
  posts: { id: string; tipo: string; historia: string; src: string }[];
}

export async function getRecuerdosDeUsuario(userId: string): Promise<GrupoRecuerdos[]> {
  const filas = await db
    .select({
      id: posts.id,
      tipo: posts.tipo,
      historia: posts.historia,
      imagenKey: posts.imagenKey,
      slug: eventos.slug,
      titulo: eventos.titulo,
    })
    .from(posts)
    .innerJoin(eventos, eq(posts.eventoId, eventos.id))
    .where(and(eq(posts.userId, userId), eq(posts.estado, 'visible')))
    .orderBy(desc(posts.createdAt));

  const map = new Map<string, GrupoRecuerdos>();
  for (const f of filas) {
    if (!map.has(f.slug)) map.set(f.slug, { slug: f.slug, titulo: f.titulo, posts: [] });
    map.get(f.slug)!.posts.push({ id: f.id, tipo: f.tipo, historia: f.historia, src: urlDeImagen(f.imagenKey) });
  }
  return [...map.values()];
}
