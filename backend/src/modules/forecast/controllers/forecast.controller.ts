import { Request, Response } from 'express';
import { ForecastService } from '../services/forecast.service';
import { ApiResponse } from '../../../utils/ApiResponse';
import DemandForecast from '../model';

export class ForecastController {
  static async generateForecast(req: Request, res: Response) {
    const { productId, warehouseId } = req.body;

    if (!productId || !warehouseId) {
      return res.status(400).json(
        new ApiResponse(400, null, 'productId and warehouseId are required')
      );
    }

    const result = await ForecastService.generateForecast(productId, warehouseId);

    if (!result.success) {
      return res.status(500).json(
        new ApiResponse(500, { errors: result.errors }, 'Forecast generation failed')
      );
    }

    const forecast = await ForecastService.getLatestForecast(productId, warehouseId);

    return res.status(200).json(
      new ApiResponse(200, forecast, 'Forecast generated successfully')
    );
  }

  static async generateAllForecasts(req: Request, res: Response) {
    const results = await ForecastService.generateAllForecasts();

    return res.status(200).json(
      new ApiResponse(200, results, 'Batch forecast generation complete')
    );
  }

  static async getLatestForecast(req: Request, res: Response) {
    const productId = req.params.productId as string;
    const warehouseId = req.params.warehouseId as string;

    const forecast = await ForecastService.getLatestForecast(productId, warehouseId);

    if (!forecast) {
      return res.status(404).json(
        new ApiResponse(404, null, 'No forecast found')
      );
    }

    return res.status(200).json(
      new ApiResponse(200, forecast, 'Forecast retrieved successfully')
    );
  }

  static async getProductForecasts(req: Request, res: Response) {
    const productId = req.params.productId as string;
    const limitParam = req.query.limit;
    let limit = 10;

    if (limitParam) {
      const limitStr = Array.isArray(limitParam) ? limitParam[0] : limitParam;
      limit = typeof limitStr === 'string' ? parseInt(limitStr, 10) : 10;
    }

    const forecasts = await ForecastService.getProductForecasts(productId, limit);

    return res.status(200).json(
      new ApiResponse(200, forecasts, 'Forecasts retrieved successfully')
    );
  }
}
