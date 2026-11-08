import sql from 'mssql';
import { dbConfig } from '../config/db.config';
import { logger } from './logger';

let pool: sql.ConnectionPool | null = null;

/**
 * Initializes and returns the shared MSSQL connection pool singleton.
 */
export async function connectDB(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  try {
    logger.info(
      { server: dbConfig.server, port: dbConfig.port, database: dbConfig.database },
      '[Database] Connecting to MSSQL...'
    );

    pool = new sql.ConnectionPool(dbConfig);
    await pool.connect();

    pool.on('error', (err) => {
      logger.error({ err }, '[Database] Unexpected MSSQL pool error occurred');
    });

    logger.info('[Database] Successfully connected to MSSQL pool.');
    return pool;
  } catch (error) {
    logger.error({ error }, '[Database] Failed to establish MSSQL connection.');
    throw error;
  }
}

/**
 * Returns the active MSSQL connection pool. Connects if not already connected.
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    return await connectDB();
  }
  return pool;
}

/**
 * Executes a heartbeat check on the database.
 */
export async function checkDBHealth(): Promise<boolean> {
  try {
    const activePool = await getPool();
    const result = await activePool.request().query('SELECT 1 AS alive');
    return result.recordset.length > 0 && result.recordset[0].alive === 1;
  } catch (error) {
    logger.warn({ error }, '[Database] Health check failed.');
    return false;
  }
}

/**
 * Closes the database connection pool during graceful shutdown.
 */
export async function closeDB(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      logger.info('[Database] MSSQL connection pool closed cleanly.');
    } catch (error) {
      logger.error({ error }, '[Database] Error while closing MSSQL connection pool.');
    } finally {
      pool = null;
    }
  }
}
