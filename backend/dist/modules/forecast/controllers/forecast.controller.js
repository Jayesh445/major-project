"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastController = void 0;
const forecast_service_1 = require("../services/forecast.service");
const ApiResponse_1 = require("../../../utils/ApiResponse");
class ForecastController {
    static async generateForecast(req, res) {
        const { productId, warehouseId } = req.body;
        if (!productId || !warehouseId) {
            return res.status(400).json(new ApiResponse_1.ApiResponse(400, null, 'productId and warehouseId are required'));
        }
        const result = await forecast_service_1.ForecastService.generateForecast(productId, warehouseId);
        if (!result.success) {
            return res.status(500).json(new ApiResponse_1.ApiResponse(500, { errors: result.errors }, 'Forecast generation failed'));
        }
        const forecast = await forecast_service_1.ForecastService.getLatestForecast(productId, warehouseId);
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, forecast, 'Forecast generated successfully'));
    }
    static async generateAllForecasts(req, res) {
        const results = await forecast_service_1.ForecastService.generateAllForecasts();
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, results, 'Batch forecast generation complete'));
    }
    static async getLatestForecast(req, res) {
        const productId = req.params.productId;
        const warehouseId = req.params.warehouseId;
        const forecast = await forecast_service_1.ForecastService.getLatestForecast(productId, warehouseId);
        if (!forecast) {
            return res.status(404).json(new ApiResponse_1.ApiResponse(404, null, 'No forecast found'));
        }
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, forecast, 'Forecast retrieved successfully'));
    }
    static async getProductForecasts(req, res) {
        const productId = req.params.productId;
        const limitParam = req.query.limit;
        let limit = 10;
        if (limitParam) {
            const limitStr = Array.isArray(limitParam) ? limitParam[0] : limitParam;
            limit = typeof limitStr === 'string' ? parseInt(limitStr, 10) : 10;
        }
        const forecasts = await forecast_service_1.ForecastService.getProductForecasts(productId, limit);
        return res.status(200).json(new ApiResponse_1.ApiResponse(200, forecasts, 'Forecasts retrieved successfully'));
    }
}
exports.ForecastController = ForecastController;
