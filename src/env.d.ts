/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user:
      | {
          id: string;
          name: string;
          email: string;
          image?: string | null;
          alias?: string | null;
          rol?: string;
          bloqueado?: boolean;
        }
      | null;
    session: { id: string } | null;
  }
}
