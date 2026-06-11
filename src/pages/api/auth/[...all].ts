import type { APIRoute } from 'astro';
import { auth } from '@/lib/auth';

// Better Auth maneja todas sus rutas (/api/auth/*) en este catch-all.
export const ALL: APIRoute = ({ request }) => auth.handler(request);
