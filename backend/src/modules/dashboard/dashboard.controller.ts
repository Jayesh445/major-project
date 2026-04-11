import { Request, Response } from 'express';
import { asyncHandler } from '@/utils';
import { ApiResponse } from '@/utils/ApiResponse';
import User from '@/modules/user/model';
import Product from '@/modules/product/model';
import Warehouse from '@/modules/warehouse/model';
import Supplier from '@/modules/supplier/model';
import Inventory from '@/modules/inventory/model';
import PurchaseOrder from '@/modules/purchase-order/model';
import DemandForecast from '@/modules/forecast/model';
import WarehouseOptimizationRecommendation from '@/modules/warehouse-optimization/model';
import NegotiationSession from '@/modules/negotiation/model';
import BlockchainLog from '@/modules/blockchain/model';

/**
 * GET /api/dashboard/admin-stats
 * Returns aggregated counts for the admin dashboard.
 */
export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalUsers, totalProducts, totalWarehouses, activeSuppliers,
    totalNegotiations, totalForecasts, totalBlockchainLogs,
    recentPOs, recentNegotiations, recentForecasts,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true }),
    Warehouse.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isApproved: true }),
    NegotiationSession.countDocuments(),
    DemandForecast.countDocuments(),
    BlockchainLog.countDocuments(),
    PurchaseOrder.find().sort({ createdAt: -1 }).limit(5)
      .populate('supplier', 'companyName')
      .populate('warehouse', 'name code')
      .select('poNumber status totalAmount triggeredBy createdAt')
      .lean(),
    NegotiationSession.find().sort({ createdAt: -1 }).limit(5)
      .populate('supplier', 'companyName')
      .populate('product', 'name sku')
      .select('status finalTerms rounds createdAt')
      .lean(),
    DemandForecast.find().sort({ forecastedAt: -1 }).limit(5)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .select('totalPredicted7Day modelVersion forecastedAt')
      .lean(),
  ]);

  // Average warehouse utilisation
  const warehouseAgg = await Warehouse.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCapacity: { $sum: '$totalCapacity' },
        usedCapacity: { $sum: '$usedCapacity' },
      },
    },
  ]);
  const utilisation =
    warehouseAgg.length && warehouseAgg[0].totalCapacity > 0
      ? Math.round((warehouseAgg[0].usedCapacity / warehouseAgg[0].totalCapacity) * 100)
      : 0;

  // Build recent activity from real events
  const recentActivity: any[] = [];

  for (const po of recentPOs) {
    recentActivity.push({
      type: 'purchase_order',
      title: `PO ${(po as any).poNumber} — ${(po as any).supplier?.companyName || 'Supplier'}`,
      description: `₹${((po as any).totalAmount || 0).toLocaleString('en-IN')} | ${(po as any).status}`,
      timestamp: (po as any).createdAt,
    });
  }
  for (const neg of recentNegotiations) {
    recentActivity.push({
      type: 'negotiation',
      title: `Negotiation with ${(neg as any).supplier?.companyName || 'Supplier'}`,
      description: `${(neg as any).rounds?.length || 0} rounds | ${(neg as any).status}${(neg as any).finalTerms ? ` | ₹${(neg as any).finalTerms.unitPrice}/unit` : ''}`,
      timestamp: (neg as any).createdAt,
    });
  }
  for (const fc of recentForecasts) {
    recentActivity.push({
      type: 'forecast',
      title: `Forecast: ${(fc as any).product?.name || 'Product'} @ ${(fc as any).warehouse?.code || 'WH'}`,
      description: `7-day predicted: ${(fc as any).totalPredicted7Day} units`,
      timestamp: (fc as any).forecastedAt,
    });
  }

  // Sort by timestamp, most recent first
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return res.json(
    new ApiResponse(200, {
      totalUsers,
      totalProducts,
      totalWarehouses,
      activeSuppliers,
      avgWarehouseUtilisation: utilisation,
      totalNegotiations,
      totalForecasts,
      totalBlockchainLogs,
      recentActivity: recentActivity.slice(0, 10),
    }, 'Admin stats fetched')
  );
});

/**
 * GET /api/dashboard/warehouse-stats
 * Returns aggregated inventory and PO metrics for the warehouse dashboard.
 */
export const getWarehouseStats = asyncHandler(async (_req: Request, res: Response) => {
  const [stockAgg, lowStockCount, pendingReceivingCount, activeTransfers, recentOptimizations] = await Promise.all([
    Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$currentStock' } } },
    ]),
    Inventory.countDocuments({ $expr: { $lte: ['$currentStock', '$reorderPoint'] } }),
    PurchaseOrder.countDocuments({
      status: { $in: ['approved', 'sent_to_supplier', 'acknowledged'] },
    }),
    WarehouseOptimizationRecommendation.countDocuments({ status: 'accepted' }),
    WarehouseOptimizationRecommendation.find()
      .sort({ generatedAt: -1 })
      .limit(5)
      .select('generatedAt transferRecommendations reallocationSummary status predictedLogisticsCostReductionPercent')
      .lean(),
  ]);

  const totalInventory = stockAgg.length ? stockAgg[0].total : 0;

  return res.json(
    new ApiResponse(200, {
      totalInventory,
      lowStockAlerts: lowStockCount,
      pendingReceiving: pendingReceivingCount,
      activeTransfers,
      recentOptimizations,
    }, 'Warehouse stats fetched')
  );
});

/**
 * GET /api/dashboard/procurement-stats
 * Returns PO counts and spend metrics for the procurement dashboard.
 */
export const getProcurementStats = asyncHandler(async (_req: Request, res: Response) => {
  // Month-to-date boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingApprovals, openOrders, fulfilledThisMonth, spendAgg] = await Promise.all([
    PurchaseOrder.countDocuments({ status: 'pending_approval' }),
    PurchaseOrder.countDocuments({
      status: { $in: ['sent_to_supplier', 'acknowledged', 'partially_received'] },
    }),
    PurchaseOrder.countDocuments({
      status: 'fully_received',
      updatedAt: { $gte: startOfMonth },
    }),
    PurchaseOrder.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'sent_to_supplier', 'acknowledged', 'partially_received', 'fully_received'] },
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const totalSpendMTD = spendAgg.length ? spendAgg[0].total : 0;

  return res.json(
    new ApiResponse(200, {
      pendingApprovals,
      openOrders,
      fulfilledThisMonth,
      totalSpendMTD,
    }, 'Procurement stats fetched')
  );
});

/**
 * GET /api/dashboard/agent-stats
 * Returns recent AI agent activity for the agent monitor page.
 */
export const getAgentStats = asyncHandler(async (_req: Request, res: Response) => {
  const [recentForecasts, latestOptimization, totalForecasts, totalOptimizations] = await Promise.all([
    DemandForecast.find()
      .sort({ forecastedAt: -1 })
      .limit(10)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .lean(),
    WarehouseOptimizationRecommendation.findOne()
      .sort({ generatedAt: -1 })
      .lean(),
    DemandForecast.countDocuments(),
    WarehouseOptimizationRecommendation.countDocuments(),
  ]);

  return res.json(
    new ApiResponse(200, {
      recentForecasts,
      latestOptimization,
      totalForecasts,
      totalOptimizations,
    }, 'Agent stats fetched')
  );
});
