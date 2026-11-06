import { Express } from 'express';
import path from 'node:path';
import swaggerJsdoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Caritas Hospital - Concurrent Appointment Booking API',
      version: '1.0.0',
      description:
        'REST API for booking doctor appointments with strict concurrency handling using Microsoft SQL Server.',
      contact: {
        name: 'Backend Developer Assessment',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Server',
      },
    ],
  },
  // Resolve beside this module in both src/ and dist/, independent of cwd.
  apis: [path.resolve(__dirname, '../routes/*.{ts,js}').replace(/\\/g, '/')],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
