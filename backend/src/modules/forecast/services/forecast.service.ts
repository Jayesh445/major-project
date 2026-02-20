import { runForecastingAgent } from '../../../ai/forecast-agent/agent';
import DemandForecast from '../model';
import Inventory from '../../inventory/model';

export class ForecastService {
  // Generate forecast for specific product-warehouse pair
  static async generateForecast(productId: string, warehouseId: string) {
    return await runForecastingAgent(productId, warehouseId);
  }

  // Generate forecasts for all active inventory records
  static async generateAllForecasts() {
    const inventories = await Inventory.find({})
      .populate('product', 'isActive')
      .populate('warehouse', 'isActive');

    const activeInventories = inventories.filter(
      (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
    );

    console.log(`Generating forecasts for ${activeInventories.length} inventory records...`);

    const results = await Promise.allSettled(
      activeInventories.map((inv: any) =>
        runForecastingAgent(inv.product._id.toString(), inv.warehouse._id.toString())
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { total: activeInventories.length, succeeded, failed };
  }

  // Get latest forecast for product-warehouse
  static async getLatestForecast(productId: string, warehouseId: string) {
    return await DemandForecast.findOne({
      product: productId,
      warehouse: warehouseId,
    })
      .sort({ forecastedAt: -1 })
      .populate('product', 'name sku')
      .populate('warehouse', 'name code');
  }

  // Get all forecasts for a product across all warehouses
  static async getProductForecasts(productId: string, limit: number = 10) {
    return await DemandForecast.find({ product: productId })
      .sort({ forecastedAt: -1 })
      .limit(limit)
      .populate('warehouse', 'name code')
      .populate('product', 'name sku');
  }
}
