import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  real,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ============================================================
// Better Auth (user / session / account / verification)
// Las claves JS en camelCase coinciden con los campos de Better Auth.
// ============================================================
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // --- campos propios ---
  alias: text('alias'),
  avatarKey: text('avatar_key'),
  rol: text('rol').notNull().default('user'), // 'user' | 'admin'
  bloqueado: boolean('bloqueado').notNull().default(false),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================
// Dominio: eventos / posts / asistencias
// ============================================================
export const eventos = pgTable('eventos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  titulo: text('titulo').notNull(),
  subtitulo: text('subtitulo').notNull().default(''),
  tipo: text('tipo').notNull().default('recital'), // recital | homenaje | otro
  fecha: text('fecha').notNull().default(''),
  lugar: text('lugar').notNull().default(''),
  ciudad: text('ciudad').notNull().default(''),
  almasBase: integer('almas_base').notNull().default(0), // convocatoria histórica (contador)
  reveladoBase: integer('revelado_base').notNull().default(0), // celdas encendidas iniciales
  meta: integer('meta').notNull().default(1400), // caras para completar la imagen
  imagenObjetivo: text('imagen_objetivo').notNull().default(''), // URL o key R2
  panoramica: text('panoramica').notNull().default(''), // foto ancha del público (URL o key R2)
  publicado: boolean('publicado').notNull().default(true),
  orden: integer('orden').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventoId: text('evento_id')
    .notNull()
    .references(() => eventos.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull().default('foto'), // 'foto' | 'recuerdo'
  imagenKey: text('imagen_key'), // key en R2 (null si es recuerdo sin foto)
  historia: text('historia').notNull().default(''),
  alias: text('alias').notNull().default(''),
  x: real('x').notNull().default(50),
  y: real('y').notNull().default(50),
  estado: text('estado').notNull().default('visible'), // 'visible' | 'oculto'
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Una fila por persona+evento => una sola alma aunque suba varios recuerdos.
export const asistencias = pgTable(
  'asistencias',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    eventoId: text('evento_id')
      .notNull()
      .references(() => eventos.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    unica: uniqueIndex('asistencia_unica').on(t.eventoId, t.userId),
  }),
);
