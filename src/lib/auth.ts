import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';

const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: { enabled: true },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {},
  user: {
    additionalFields: {
      alias: { type: 'string', required: false },
      avatarKey: { type: 'string', required: false },
      rol: { type: 'string', required: false, defaultValue: 'user', input: false },
      bloqueado: { type: 'boolean', required: false, defaultValue: false, input: false },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-cambiar-en-produccion',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4321',
});
