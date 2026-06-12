import type { APIRoute } from 'astro';
import { getObject, r2Configurado } from '@/lib/r2';

// Sirve las imágenes guardadas en R2 a través del server (no requiere bucket
// público ni CORS). Cacheable: las keys son únicas e inmutables.
export const GET: APIRoute = async ({ params }) => {
  if (!r2Configurado) return new Response('No disponible', { status: 503 });
  const key = params.key;
  if (!key) return new Response('Falta la imagen', { status: 400 });
  try {
    const { body, contentType } = await getObject(key);
    return new Response(body, {
      headers: {
        'content-type': contentType || 'image/jpeg',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('No encontrada', { status: 404 });
  }
};
