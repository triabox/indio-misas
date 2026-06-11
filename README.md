# MISAS — el archivo de los que estuvieron

Web de fans del Indio Solari: archivo colectivo de recitales y homenajes. Cada
persona suma su **foto** o su **recuerdo** de que estuvo, y todas juntas revelan
una imagen del Indio en un **fotomosaico** que se enciende a medida que llega
gente. Incluye panorámica "encontrate en la multitud", muro de historias y
contador de almas.

Proyecto de fans, sin fines de lucro.

## Stack

- **Astro** (SSR, adaptador Node) + **React islands** + **Tailwind**
- **PostgreSQL** + **Drizzle ORM** (en dev usa **pglite** embebido, sin Docker)
- **Better Auth** (email/contraseña + Google)
- **Cloudflare R2** para las fotos (egress $0)
- Deploy en **Easypanel** (Docker)

## Desarrollo

```bash
npm install
npm run db:setup   # migra + siembra los eventos (pglite en ./.pglite)
npm run dev        # http://localhost:4321
```

Sin `DATABASE_URL` usa pglite. Con `DATABASE_URL` apunta a Postgres real.

## Variables de entorno

Ver [`.env.example`](.env.example). Mínimas para producción: `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Opcionales: Google OAuth y Cloudflare R2.

## Build / producción

```bash
npm run build
npm run db:setup   # con DATABASE_URL seteado, migra el Postgres de prod
npm start          # node ./dist/server/entry.mjs
```

El `Dockerfile` hace todo esto: build, migraciones + seed, y arranca el server.
