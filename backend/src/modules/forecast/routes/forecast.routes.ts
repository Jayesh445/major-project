import express from 'express';
import { ForecastController } from '../controllers/forecast.controller';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = express.Router();

// POST /api/forecast/generate - Generate forecast for specific product-warehouse
router.post('/generate', asyncHandler(ForecastController.generateForecast));

// POST /api/forecast/generate-all - Generate all forecasts
router.post('/generate-all', asyncHandler(ForecastController.generateAllForecasts));

// GET /api/forecast/:productId/:warehouseId - Get latest forecast
router.get('/:productId/:warehouseId', asyncHandler(ForecastController.getLatestForecast));

// GET /api/forecast/product/:productId - Get all forecasts for product
router.get('/product/:productId', asyncHandler(ForecastController.getProductForecasts));

export default router;
