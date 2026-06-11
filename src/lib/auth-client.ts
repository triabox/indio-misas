import { createAuthClient } from 'better-auth/client';

// baseURL vacío => usa el origin actual (sirve en dev y prod).
export const authClient = createAuthClient();
