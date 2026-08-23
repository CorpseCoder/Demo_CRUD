import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error("DATABASE_URL is not set");
}

const needsSsl =
  /sslmode=require/.test(connectionString ?? "") ||
  (connectionString ?? "").includes("neon.tech");

const globalForPg = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForPg.pool ??
  new Pool({
    connectionString: connectionString ?? "postgres://localhost:5432/postgres",
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool;
}

export const db = drizzle(pool, { schema });
