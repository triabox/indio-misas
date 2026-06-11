import { defineMiddleware } from 'astro:middleware';
import { auth } from '@/lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const session = await auth.api.getSession({ headers: context.request.headers }).catch(() => null);
  context.locals.user = (session?.user as App.Locals['user']) ?? null;
  context.locals.session = session?.session ? { id: session.session.id } : null;

  // Guarda del panel admin
  if (context.url.pathname.startsWith('/admin')) {
    if (!context.locals.user) return context.redirect('/entrar?next=/admin');
    if (context.locals.user.rol !== 'admin') return new Response('No autorizado', { status: 403 });
  }

  return next();
});
