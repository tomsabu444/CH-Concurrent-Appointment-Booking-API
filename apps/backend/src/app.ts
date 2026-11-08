import express, { Express } from 'express';
import cors from 'cors';
import healthRoutes from './features/health/health.routes';
import appointmentRoutes from './features/appointments/appointment.routes';
import { setupSwagger } from './lib/swagger';
import { httpLogger } from './middleware/httpLogger';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(httpLogger);

//* Swagger Documentation
setupSwagger(app);

//* Routes
app.use('/health', healthRoutes);
app.use('/api/appointments', appointmentRoutes);

//* Centralized Error Handler (must be registered after all routes)
app.use(errorHandler);

export default app;
