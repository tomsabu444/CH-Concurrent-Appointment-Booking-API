import { env } from './config/env';
import app from './app';
import { logger } from './lib/logger';
import { connectDB, closeDB } from './lib/db';

const PORT = env.PORT;

async function startServer(): Promise<void> {
  try {
    // 1. Establish database connection pool before accepting requests
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`[Server] Concurrent Appointment Booking API running on port ${PORT}`);
      logger.info(`[Docs] Swagger UI available at http://localhost:${PORT}/api-docs`);
      logger.info(`[Health] Status endpoint active at http://localhost:${PORT}/health`);
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`[Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        logger.info('[Server] HTTP server closed.');
        await closeDB();
        process.exit(0);
      });

      // Force shutdown after timeout if pending connections hang
      setTimeout(() => {
        logger.error('[Server] Forcing shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error }, '[Server] Fatal error during startup. Exiting.');
    process.exit(1);
  }
}

startServer();
