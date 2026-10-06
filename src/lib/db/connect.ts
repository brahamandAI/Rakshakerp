/**
 * Optional MongoDB connection helpers for offline migration / diagnostic scripts.
 *
 * Production application runtime does NOT call these.
 * Prefer Prisma (`@/lib/db/prisma`) for all app data access.
 */

import mongoose, { Mongoose } from "mongoose";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const connectionOptions: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 2,
  connectTimeoutMS: 10_000,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  heartbeatFrequencyMS: 10_000,
  retryWrites: true,
  retryReads: true,
};

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Required only for offline Mongo migration/diagnostic scripts."
    );
  }
  return uri;
}

function isConnectionReady(conn: Mongoose): boolean {
  return conn.connection.readyState === 1;
}

async function connectWithRetry(uri: string, attempts = 3): Promise<Mongoose> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const instance = await mongoose.connect(uri, connectionOptions);
      if (process.env.NODE_ENV === "development") {
        console.info(
          `[db] Connected to MongoDB (${instance.connection.db?.databaseName ?? "default"})`
        );
      }
      return instance;
    } catch (error) {
      lastError = error;
      await mongoose.disconnect().catch(() => undefined);
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 400));
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `MongoDB connection failed: ${message}. In Atlas go to Network Access and add your current public IP (run: npm run db:ip).`
  );
}

/** Offline / migration helper — not used by production request handlers. */
export async function connectDB(): Promise<Mongoose> {
  const uri = getMongoUri();

  if (cached.conn && isConnectionReady(cached.conn)) {
    return cached.conn;
  }

  if (cached.conn && !isConnectionReady(cached.conn)) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry(uri).catch((error: unknown) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/** Offline / migration helper — not used by production health checks. */
export async function pingDB(): Promise<{
  ok: boolean;
  database?: string;
  error?: string;
}> {
  try {
    const conn = await connectDB();
    await conn.connection.db?.admin().ping();
    return { ok: true, database: conn.connection.db?.databaseName };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
