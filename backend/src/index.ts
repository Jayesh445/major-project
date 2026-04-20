import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '@/middlewares';
import { asyncHandler, sendSuccess, ApiError, HttpStatus } from '@/utils';
import { database, env } from '@/config';
import userRoutes from '@/modules/user/routes';
import productRoutes from '@/modules/product/routes';
import warehouseRoutes from '@/modules/warehouse/routes';
import supplierRoutes from '@/modules/supplier/routes';
import inventoryRoutes from '@/modules/inventory/routes';
import purchaseOrderRoutes from '@/modules/purchase-order/routes';
import negotiationRoutes from '@/modules/negotiation/routes';
import forecastRoutes from '@/modules/forecast/routes/forecast.routes';
import optimizationRoutes from '@/modules/warehouse-optimization/routes/optimization.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import internalRoutes from '@/modules/internal/internal.routes';
import { internalAuth } from '@/middlewares/internalAuth';
import { ForecastScheduler } from '@/modules/forecast/services/scheduler.service';
import agentRoutes from '@/modules/agents/agent.routes';
import blockchainRoutes from '@/modules/blockchain/routes';
import qrRoutes from '@/modules/qr/qr.routes';
import { startConfirmationWorker, stopConfirmationWorker } from '@/modules/blockchain/worker';

const app: Express = express();
const PORT = parseInt(env.PORT, 10);

// Middleware
app.use(cors());

// Capture raw body for webhook signature verification
// Must come before express.json() to intercept the raw stream
app.use((req: Request, res: Response, next) => {
  if (req.path === '/api/blockchain/webhook') {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });
    req.on('end', () => {
      (req as any).rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/negotiations', negotiationRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/warehouse-optimization', optimizationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/internal', internalAuth, internalRoutes);

// Example route using utilities
app.get(
  '/api/example',
  asyncHandler(async (req: Request, res: Response) => {
    const data = { message: 'Hello from API' };
    return sendSuccess(res, data, 'Data fetched successfully');
  })
);

// Example error route
app.get(
  '/api/error-example',
  asyncHandler(async (req: Request, res: Response) => {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'This is a custom error');
  })
);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  await database.connect();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start forecast scheduler
    ForecastScheduler.start();

    // Start blockchain confirmation worker
    startConfirmationWorker();
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  ForecastScheduler.stop();
  stopConfirmationWorker();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  ForecastScheduler.stop();
  stopConfirmationWorker();
  process.exit(0);
});

export default app;
