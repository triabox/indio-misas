import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';

// En producción (Easypanel) se setea DATABASE_URL y usamos Postgres real.
// En dev usamos pglite (Postgres embebido, sin Docker), persistido en ./.pglite.
const url = process.env.DATABASE_URL;

export const db = (
  url
    ? drizzlePg(new pg.Pool({ connectionString: url }), { schema })
    : drizzlePglite(new PGlite('.pglite'), { schema })
) as unknown as NodePgDatabase<typeof schema>;

export { schema };
