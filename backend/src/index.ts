import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { environment } from './config/index.js';
import { logger } from './lib/logger.js';
import { clerkAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { swaggerSpec } from './docs/swagger.js';

const app = express();

app.use(
  cors({
    origin: environment.corsOrigin,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8');
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Swagger - keep public
app.get('/docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use(
  '/docs',
  swaggerUi.serveFiles(swaggerSpec),
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  })
);


app.use(clerkAuth);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ForgeOps Backend Running',
  });
});

app.use(`/api/${environment.apiVersion}`, routes);

app.use(errorHandler);

const PORT = environment.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logger.info(`🚀 ForgeOps API Server running on port ${PORT}`);
});

export default app;