import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // Reuse the pool across hot reloads in dev
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function buildPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({
    connectionString,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_MS ?? 30_000),
    // Read-only safety: refuse any accidental writes at the connection level
    // by setting default_transaction_read_only on each new client.
    application_name: "parliament-api",
  });
}

export const pool: Pool = global.__pgPool ?? buildPool();
if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

// Set every client to read-only on connect — defence in depth.
pool.on("connect", (client: PoolClient) => {
  client.query("SET default_transaction_read_only = on").catch(() => {
    /* swallow — not all roles allow SET, but the API only issues SELECTs anyway */
  });
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params as unknown[]);
}
