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

const app: Express = express();
const PORT = parseInt(env.PORT, 10);

// Middleware
app.use(cors());
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
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
