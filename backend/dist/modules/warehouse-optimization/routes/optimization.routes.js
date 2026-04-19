"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const optimization_controller_1 = require("../controllers/optimization.controller");
const asyncHandler_1 = require("../../../utils/asyncHandler");
const router = express_1.default.Router();
// POST /api/warehouse-optimization/generate - Generate new optimization recommendations
router.post('/generate', (0, asyncHandler_1.asyncHandler)(optimization_controller_1.OptimizationController.generateRecommendations));
// GET /api/warehouse-optimization/latest - Get latest recommendation
router.get('/latest', (0, asyncHandler_1.asyncHandler)(optimization_controller_1.OptimizationController.getLatestRecommendation));
// GET /api/warehouse-optimization/metrics - Get performance metrics
router.get('/metrics', (0, asyncHandler_1.asyncHandler)(optimization_controller_1.OptimizationController.getPerformanceMetrics));
// GET /api/warehouse-optimization - Get all recommendations with filters
router.get('/', (0, asyncHandler_1.asyncHandler)(optimization_controller_1.OptimizationController.getRecommendations));
// GET /api/warehouse-optimization/:id - Get recommendation by ID
router.get('/:id', (0, asyncHandler_1.asyncHandler)(optimization_controller_1.OptimizationController.getRecommendationById));
// PATCH /api/warehouse-optimization/:id/status - Update recommendation status
router.patch('/:id/status', (0, asyncHandler_1.asyncHandler)(optimization_controller_1.OptimizationController.updateRecommendationStatus));
exports.default = router;
