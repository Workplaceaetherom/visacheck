// VisaCheck — database accessor (optional, not used by the core app).
//
// IMPORTANT: VisaCheck is store-nothing by design — the visa rules engine,
// wizard answers, and announcements are all evaluated in-memory and NEVER
// persisted to a database. This module exists only for optional deployment
// integrations (e.g. an operator-managed feedback archive) and must not be
// imported by any user-facing flow that handles applicant answers.
//
// The Prisma client is loaded lazily via require() so the Next.js build does
// not fail when `prisma generate` has not been run in the environment. If the
// generated client is missing, accessing `db` throws a clear, actionable error
// instead of breaking the whole bundle at compile time.

/* eslint-disable @typescript-eslint/no-require-imports */

type PrismaClientCtor = new (options?: Record<string, unknown>) => unknown;

let cached: unknown | undefined;

function createClient(): unknown {
  if (cached !== undefined) return cached;
  try {
    // Lazy require: keeps the build green even without a generated client.
    const mod = require('@prisma/client') as { PrismaClient?: PrismaClientCtor };
    if (!mod || typeof mod.PrismaClient !== 'function') {
      throw new Error('missing');
    }
    cached = new mod.PrismaClient({ log: ['query'] });
    if (process.env.NODE_ENV !== 'production') {
      (globalThis as { prismaDb?: unknown }).prismaDb = cached;
    }
    return cached;
  } catch {
    throw new Error(
      '[VisaCheck] Prisma client has not been generated. Run `npx prisma generate` first. ' +
        'Note: the VisaCheck app itself is store-nothing and does not require a database.'
    );
  }
}

/**
 * Lazily-initialised Prisma client proxy. Only touched by optional
 * server-side integrations — never by the visa check flows.
 */
export const db = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    const client = createClient();
    return Reflect.get(client as object, prop);
  },
});
