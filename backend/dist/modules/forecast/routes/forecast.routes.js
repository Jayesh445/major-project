"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const forecast_controller_1 = require("../controllers/forecast.controller");
const asyncHandler_1 = require("../../../utils/asyncHandler");
const router = express_1.default.Router();
// POST /api/forecast/generate - Generate forecast for specific product-warehouse
router.post('/generate', (0, asyncHandler_1.asyncHandler)(forecast_controller_1.ForecastController.generateForecast));
// POST /api/forecast/generate-all - Generate all forecasts
router.post('/generate-all', (0, asyncHandler_1.asyncHandler)(forecast_controller_1.ForecastController.generateAllForecasts));
// GET /api/forecast/:productId/:warehouseId - Get latest forecast
router.get('/:productId/:warehouseId', (0, asyncHandler_1.asyncHandler)(forecast_controller_1.ForecastController.getLatestForecast));
// GET /api/forecast/product/:productId - Get all forecasts for product
router.get('/product/:productId', (0, asyncHandler_1.asyncHandler)(forecast_controller_1.ForecastController.getProductForecasts));
exports.default = router;
