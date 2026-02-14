import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '@/middlewares';
import { asyncHandler, sendSuccess, ApiError, HttpStatus } from '@/utils';
import userRoutes from '@/modules/user/routes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', userRoutes);

// Example route using utilities
app.get(
  '/api/example',
  asyncHandler(async (req: Request, res: Response) => {
    // Simulate async operation
    const data = { message: 'Hello from API' };
    
    // Use response handler
    return sendSuccess(res, data, 'Data fetched successfully');
  })
);

// Example error route
app.get(
  '/api/error-example',
  asyncHandler(async (req: Request, res: Response) => {
    // Throw custom API error
    throw new ApiError(HttpStatus.BAD_REQUEST, 'This is a custom error');
  })
);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
