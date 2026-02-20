import express from 'express';
import { OptimizationController } from '../controllers/optimization.controller';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = express.Router();

// POST /api/warehouse-optimization/generate - Generate new optimization recommendations
router.post('/generate', asyncHandler(OptimizationController.generateRecommendations));

// GET /api/warehouse-optimization/latest - Get latest recommendation
router.get('/latest', asyncHandler(OptimizationController.getLatestRecommendation));

// GET /api/warehouse-optimization/metrics - Get performance metrics
router.get('/metrics', asyncHandler(OptimizationController.getPerformanceMetrics));

// GET /api/warehouse-optimization - Get all recommendations with filters
router.get('/', asyncHandler(OptimizationController.getRecommendations));

// GET /api/warehouse-optimization/:id - Get recommendation by ID
router.get('/:id', asyncHandler(OptimizationController.getRecommendationById));

// PATCH /api/warehouse-optimization/:id/status - Update recommendation status
router.patch('/:id/status', asyncHandler(OptimizationController.updateRecommendationStatus));

export default router;
