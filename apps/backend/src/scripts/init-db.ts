import { loadEnvFile } from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

// Load database-level .env if present for Docker/admin environment values
const databaseEnvCandidates = [
  path.resolve(process.cwd(), 'database/.env'),
  path.resolve(__dirname, '../../../../database/.env'),
];

for (const envFile of databaseEnvCandidates) {
  if (fs.existsSync(envFile)) {
    try {
      loadEnvFile(envFile);
    } catch {
      // Ignore if cannot load
    }
  }
}

import sql from 'mssql';
import { env } from '../config/env';
import { dbConfig } from '../config/db.config';
import { logger } from '../lib/logger';

function getScriptsDir(): string {
  const candidates = [
    path.resolve(__dirname, '../../../../database/scripts'),
    path.resolve(__dirname, '../../../database/scripts'),
    path.resolve(process.cwd(), 'database/scripts'),
    '/app/database/scripts',
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  throw new Error(`Database scripts directory not found. Checked: ${candidates.join(', ')}`);
}

function splitSqlBatches(sqlContent: string): string[] {
  return sqlContent
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter((batch) => batch.length > 0);
}

async function connectWithRetry(config: sql.config, maxRetries = 10, delayMs = 2000): Promise<sql.ConnectionPool> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await new sql.ConnectionPool(config).connect();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      logger.warn(`[CLI db:init] SQL Server not ready yet (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Connection failed after maximum retries');
}

export async function runDatabaseInit(): Promise<void> {
  const targetDbName = env.DB_NAME;

  logger.info({ server: dbConfig.server, port: dbConfig.port }, '[CLI db:init] Connecting to SQL Server master...');

  // 1. Connect to master to ensure target database exists
  const masterConfig: sql.config = {
    ...dbConfig,
    database: 'master',
    connectionTimeout: 15000,
    requestTimeout: 15000,
  };

  const masterPool = await connectWithRetry(masterConfig);

  try {
    const dbCheck = await masterPool
      .request()
      .input('dbName', sql.NVarChar, targetDbName)
      .query('SELECT 1 FROM sys.databases WHERE name = @dbName;');

    if (dbCheck.recordset.length === 0) {
      logger.info(`[CLI db:init] Creating database "${targetDbName}"...`);
      const sanitizedDbName = targetDbName.replace(/\]/g, ']]');
      await masterPool.request().query(`CREATE DATABASE [${sanitizedDbName}];`);
      logger.info(`[CLI db:init] Database "${targetDbName}" created successfully.`);
    } else {
      logger.info(`[CLI db:init] Database "${targetDbName}" already exists.`);
    }
  } finally {
    await masterPool.close();
  }

  // 2. Connect to target database to apply schema and sample seeds
  const targetConfig: sql.config = {
    ...dbConfig,
    database: targetDbName,
    connectionTimeout: 15000,
    requestTimeout: 15000,
  };

  const targetPool = await connectWithRetry(targetConfig);

  try {
    const scriptsDir = getScriptsDir();
    const schemaFile = path.join(scriptsDir, '01_create_database_and_tables.sql');
    const seedFile = path.join(scriptsDir, '02_seed_sample_data.sql');

    logger.info('[CLI db:init] Executing schema script (01_create_database_and_tables.sql)...');
    const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
    for (const batch of splitSqlBatches(schemaSql)) {
      await targetPool.request().query(batch);
    }
    logger.info('[CLI db:init] Schema definition applied successfully.');

    if (fs.existsSync(seedFile)) {
      logger.info('[CLI db:init] Executing seed script (02_seed_sample_data.sql)...');
      const seedSql = fs.readFileSync(seedFile, 'utf-8');
      for (const batch of splitSqlBatches(seedSql)) {
        await targetPool.request().query(batch);
      }
      logger.info('[CLI db:init] Sample seed data applied successfully.');
    }
  } finally {
    await targetPool.close();
  }
}

if (require.main === module) {
  runDatabaseInit()
    .then(() => {
      logger.info('[CLI db:init] Completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, '[CLI db:init] Failed.');
      process.exit(1);
    });
}
