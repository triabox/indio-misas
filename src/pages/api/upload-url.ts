import type { APIRoute } from 'astro';
import { presignPut, r2Configurado } from '@/lib/r2';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

const TIPOS = /^image\/(jpeg|png|webp)$/;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: 'Entrá para subir una foto.' }, 401);
  if (user.bloqueado) return json({ error: 'Tu cuenta está bloqueada.' }, 403);
  if (!r2Configurado) return json({ error: 'La subida de fotos no está disponible.' }, 503);

  const body = await request.json().catch(() => null);
  const contentType = String(body?.contentType || '');
  if (!TIPOS.test(contentType)) return json({ error: 'Formato no permitido (jpg, png o webp).' }, 400);

  const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
  const key = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const url = await presignPut(key, contentType);
  return json({ url, key });
};
