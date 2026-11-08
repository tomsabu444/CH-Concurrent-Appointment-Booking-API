import { Router, Request, Response } from 'express';
import { checkDBHealth } from '../../lib/db';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: API Health Check
 *     description: Returns the operational status of the API and its MSSQL database connection.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server and database are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Database is disconnected or unhealthy
 */
router.get('/', async (_req: Request, res: Response) => {
  const isDbHealthy = await checkDBHealth();

  if (!isDbHealthy) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
