import { randomUUID } from 'node:crypto';

// Migra el esquema y siembra los eventos reales.
// Dev (sin DATABASE_URL): pglite. Prod (con DATABASE_URL): Postgres real.

const WC = 'https://upload.wikimedia.org/wikipedia/commons';
const EVENTOS = [
  {
    slug: 'homenaje-2026', titulo: 'Velas por el Indio', subtitulo: 'El adiós ricotero · junio de 2026',
    tipo: 'homenaje', fecha: 'Junio 2026', lugar: 'Plazas de todo el país', ciudad: 'Argentina',
    almasBase: 45000, reveladoBase: 320, meta: 1000, orden: 0,
    imagenObjetivo: `${WC}/b/bd/Indio_solari.jpg`,
  },
  {
    slug: 'olavarria-2017', titulo: 'Olavarría 2017', subtitulo: 'La última misa · 11 de marzo',
    tipo: 'recital', fecha: 'Marzo 2017', lugar: 'Predio La Colmena', ciudad: 'Olavarría',
    almasBase: 300000, reveladoBase: 1150, meta: 1800, orden: 1,
    imagenObjetivo: `${WC}/thumb/2/20/Indio_Solari_2011.jpg/1280px-Indio_Solari_2011.jpg`,
  },
  {
    slug: 'tandil-2016', titulo: 'Tandil 2016', subtitulo: 'El Hipódromo temblando · 12 de marzo',
    tipo: 'recital', fecha: 'Marzo 2016', lugar: 'Hipódromo de Tandil', ciudad: 'Tandil',
    almasBase: 200000, reveladoBase: 950, meta: 1600, orden: 2,
    imagenObjetivo: `${WC}/c/c1/Indio_solari_uruguay.jpg`,
  },
  {
    slug: 'gualeguaychu-2014', titulo: 'Gualeguaychú 2014', subtitulo: 'Bajo la tormenta y el barro',
    tipo: 'recital', fecha: 'Abril 2014', lugar: 'Hipódromo', ciudad: 'Gualeguaychú',
    almasBase: 170000, reveladoBase: 700, meta: 1500, orden: 3,
    imagenObjetivo: `${WC}/d/db/Indiosolari-laplata-2005.JPG`,
  },
  {
    slug: 'mendoza-2013', titulo: 'Mendoza 2013', subtitulo: 'Autódromo de San Martín · 14 de septiembre',
    tipo: 'recital', fecha: 'Septiembre 2013', lugar: 'Autódromo Jorge Á. Pena', ciudad: 'San Martín, Mendoza',
    almasBase: 150000, reveladoBase: 800, meta: 1400, orden: 4,
    imagenObjetivo: `${WC}/e/ed/Los_redondos_en_salta_1978.jpg`,
  },
  {
    slug: 'tandil-2011', titulo: 'Tandil 2011', subtitulo: 'La gran misa en el Hipódromo · 3 de diciembre',
    tipo: 'recital', fecha: 'Diciembre 2011', lugar: 'Hipódromo de Tandil', ciudad: 'Tandil',
    almasBase: 100000, reveladoBase: 520, meta: 1200, orden: 5,
    imagenObjetivo: `${WC}/a/a8/Patricio_Rey_y_sus_Redonditos_de_Ricota_durante_una_actuaci%C3%B3n_en_los_a%C3%B1os_70.jpg`,
  },
];

const INSERT = `INSERT INTO eventos
  (id, slug, titulo, subtitulo, tipo, fecha, lugar, ciudad, almas_base, revelado_base, meta, imagen_objetivo, panoramica, orden)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  ON CONFLICT (slug) DO NOTHING`;

function params(e) {
  const pano = `https://picsum.photos/seed/${e.slug}-pano/1600/640?grayscale`;
  return [randomUUID(), e.slug, e.titulo, e.subtitulo, e.tipo, e.fecha, e.lugar, e.ciudad, e.almasBase, e.reveladoBase, e.meta, e.imagenObjetivo, pano, e.orden];
}

const url = process.env.DATABASE_URL;

if (url) {
  const pg = (await import('pg')).default;
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const pool = new pg.Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
  for (const e of EVENTOS) await pool.query(INSERT, params(e));
  await pool.end();
} else {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const client = new PGlite('.pglite');
  await migrate(drizzle(client), { migrationsFolder: './drizzle' });
  for (const e of EVENTOS) await client.query(INSERT, params(e));
  await client.close();
}

console.log(`DB lista: migraciones aplicadas + ${EVENTOS.length} eventos sembrados (${url ? 'Postgres' : 'pglite dev'}).`);
