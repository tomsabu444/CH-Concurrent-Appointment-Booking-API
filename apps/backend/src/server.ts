import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Load package-level .env (apps/backend/.env)
const packageEnv = path.resolve(__dirname, '../.env');
if (existsSync(packageEnv)) {
  loadEnvFile(packageEnv);
}

import app from './app';
import { logger } from './config/logger';

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  logger.info(`[Server] Concurrent Appointment Booking API running on port ${PORT}`);
  logger.info(`[Docs] Swagger UI available at http://localhost:${PORT}/api-docs`);
});
