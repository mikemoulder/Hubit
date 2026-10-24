import postgres from "postgres";

// One connection pool per server instance. On Vercel the transaction pooler
// (POSTGRES_URL, port 6543) is used, which cannot hold prepared statements.
let sql: postgres.Sql | null = null;

export function db(): postgres.Sql | null {
  const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
  if (!url) return null;
  sql ??= postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 });
  return sql;
}

/** Which deployment is writing: rows from previews never mix into production's history. */
export function envName(): string {
  return process.env.VERCEL_ENV ?? "development";
}

/** Runs a database call, or returns the fallback if there is no database or it fails. */
export async function maybe<T>(fallback: T, fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = db();
  if (!sql) return fallback;
  try {
    return await fn(sql);
  } catch (err) {
    console.error("database:", err instanceof Error ? err.message : err);
    return fallback;
  }
}
