/**
 * Next.js instrumentation — Node.js runtime startup hooks.
 * Avoid importing Prisma/`pg` here: Next's instrumentation webpack graph
 * cannot bundle Node built-ins used by the PostgreSQL driver.
 *
 * One-time Employee currentStep repair runs via Prisma on first server
 * Prisma usage (see `@/lib/db/prisma`).
 */
export async function register() {
  // Intentionally empty: Mongo is not connected at boot; PG repair is
  // triggered from the Prisma client module on the Node server.
}
