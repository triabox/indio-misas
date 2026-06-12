import type { APIRoute } from 'astro';
import { uploadObject, r2Configurado } from '@/lib/r2';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

const TIPOS = /^image\/(jpeg|png|webp)$/;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: 'Entrá para subir una foto.' }, 401);
  if (user.bloqueado) return json({ error: 'Tu cuenta está bloqueada.' }, 403);
  if (!r2Configurado) return json({ error: 'La subida de fotos no está disponible.' }, 503);

  const contentType = request.headers.get('content-type') || '';
  if (!TIPOS.test(contentType)) return json({ error: 'Formato no permitido (jpg, png o webp).' }, 400);

  const buf = new Uint8Array(await request.arrayBuffer());
  if (buf.byteLength === 0) return json({ error: 'Archivo vacío.' }, 400);
  if (buf.byteLength > 1_500_000) return json({ error: 'La foto es muy pesada (máx ~1,5 MB).' }, 413);

  const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
  const key = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await uploadObject(key, buf, contentType);
  return json({ key });
};
