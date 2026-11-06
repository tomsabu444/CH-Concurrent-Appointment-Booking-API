import express, { Express } from 'express';
import healthRoutes from './routes/health.routes';
import { setupSwagger } from './config/swagger';
import { httpLogger } from './middleware/httpLogger';

const app: Express = express();

app.use(express.json());
app.use(httpLogger);

//* Swagger Documentation
setupSwagger(app);

//* Routes
app.use('/health', healthRoutes);

export default app;
