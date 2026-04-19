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
import AgentRun from '@/modules/agents/agent-run.model';

/**
 * GET /api/dashboard/admin-stats
 * Returns aggregated counts for the admin dashboard.
 */
export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalUsers, totalProducts, totalWarehouses, activeSuppliers,
    totalNegotiations, totalForecasts, totalBlockchainLogs,
    recentAgentRuns,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true }),
    Warehouse.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isApproved: true }),
    NegotiationSession.countDocuments(),
    DemandForecast.countDocuments(),
    BlockchainLog.countDocuments(),
    AgentRun.find()
      .sort({ startedAt: -1 })
      .limit(20)
      .populate('triggeredBy', 'name email')
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

  // Build recent activity from agent runs — every agent execution with clickable link
  const agentNameMap: Record<string, string> = {
    'forecast-agent': 'Demand Forecast Agent',
    'warehouse-optimization-agent': 'Warehouse Optimization Agent',
    'negotiation-agent': 'Negotiation Agent',
    'supplier-simulator-agent': 'Supplier Simulator Agent',
    'procurement-orchestrator-agent': 'Procurement Orchestrator Agent',
    'supplier-evaluation-agent': 'Supplier Evaluation Agent',
    'anomaly-detection-agent': 'Anomaly Detection Agent',
    'smart-reorder-agent': 'Smart Reorder Agent',
    'quality-control-agent': 'Quality Control Agent',
  };

  const recentActivity = recentAgentRuns.map((run: any) => {
    const agentName = agentNameMap[run.agentId] || run.agentId;
    const durationStr = run.durationMs != null
      ? run.durationMs < 1000
        ? `${run.durationMs}ms`
        : `${Math.floor(run.durationMs / 1000)}s`
      : '—';

    // Extract a user-friendly description per agent type
    let description = `${run.status} | ${durationStr}`;
    if (run.error) {
      description += ` | ${String(run.error).slice(0, 80)}`;
    }

    return {
      type: run.agentId,
      agentId: run.agentId,
      runId: run._id,
      title: `${agentName} — ${run.status}`,
      description,
      status: run.status,
      durationMs: run.durationMs,
      timestamp: run.startedAt,
      triggeredBy: run.triggeredBy,
      // Link to the agent detail page where full run history is visible
      link: `/dashboard/dev-tools/agent-hub/${run.agentId}`,
    };
  });

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
      recentActivity: recentActivity.slice(0, 15),
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
