"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentStats = exports.getProcurementStats = exports.getWarehouseStats = exports.getAdminStats = void 0;
const utils_1 = require("@/utils");
const ApiResponse_1 = require("@/utils/ApiResponse");
const model_1 = __importDefault(require("@/modules/user/model"));
const model_2 = __importDefault(require("@/modules/product/model"));
const model_3 = __importDefault(require("@/modules/warehouse/model"));
const model_4 = __importDefault(require("@/modules/supplier/model"));
const model_5 = __importDefault(require("@/modules/inventory/model"));
const model_6 = __importDefault(require("@/modules/purchase-order/model"));
const model_7 = __importDefault(require("@/modules/forecast/model"));
const model_8 = __importDefault(require("@/modules/warehouse-optimization/model"));
const model_9 = __importDefault(require("@/modules/negotiation/model"));
const model_10 = __importDefault(require("@/modules/blockchain/model"));
const agent_run_model_1 = __importDefault(require("@/modules/agents/agent-run.model"));
/**
 * GET /api/dashboard/admin-stats
 * Returns aggregated counts for the admin dashboard.
 */
exports.getAdminStats = (0, utils_1.asyncHandler)(async (_req, res) => {
    const [totalUsers, totalProducts, totalWarehouses, activeSuppliers, totalNegotiations, totalForecasts, totalBlockchainLogs, recentAgentRuns,] = await Promise.all([
        model_1.default.countDocuments({ isActive: true }),
        model_2.default.countDocuments({ isActive: true }),
        model_3.default.countDocuments({ isActive: true }),
        model_4.default.countDocuments({ isApproved: true }),
        model_9.default.countDocuments(),
        model_7.default.countDocuments(),
        model_10.default.countDocuments(),
        agent_run_model_1.default.find()
            .sort({ startedAt: -1 })
            .limit(20)
            .populate('triggeredBy', 'name email')
            .lean(),
    ]);
    // Average warehouse utilisation
    const warehouseAgg = await model_3.default.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                totalCapacity: { $sum: '$totalCapacity' },
                usedCapacity: { $sum: '$usedCapacity' },
            },
        },
    ]);
    const utilisation = warehouseAgg.length && warehouseAgg[0].totalCapacity > 0
        ? Math.round((warehouseAgg[0].usedCapacity / warehouseAgg[0].totalCapacity) * 100)
        : 0;
    // Build recent activity from agent runs — every agent execution with clickable link
    const agentNameMap = {
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
    const recentActivity = recentAgentRuns.map((run) => {
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
    return res.json(new ApiResponse_1.ApiResponse(200, {
        totalUsers,
        totalProducts,
        totalWarehouses,
        activeSuppliers,
        avgWarehouseUtilisation: utilisation,
        totalNegotiations,
        totalForecasts,
        totalBlockchainLogs,
        recentActivity: recentActivity.slice(0, 15),
    }, 'Admin stats fetched'));
});
/**
 * GET /api/dashboard/warehouse-stats
 * Returns aggregated inventory and PO metrics for the warehouse dashboard.
 */
exports.getWarehouseStats = (0, utils_1.asyncHandler)(async (_req, res) => {
    const [stockAgg, lowStockCount, pendingReceivingCount, activeTransfers, recentOptimizations] = await Promise.all([
        model_5.default.aggregate([
            { $group: { _id: null, total: { $sum: '$currentStock' } } },
        ]),
        model_5.default.countDocuments({ $expr: { $lte: ['$currentStock', '$reorderPoint'] } }),
        model_6.default.countDocuments({
            status: { $in: ['approved', 'sent_to_supplier', 'acknowledged'] },
        }),
        model_8.default.countDocuments({ status: 'accepted' }),
        model_8.default.find()
            .sort({ generatedAt: -1 })
            .limit(5)
            .select('generatedAt transferRecommendations reallocationSummary status predictedLogisticsCostReductionPercent')
            .lean(),
    ]);
    const totalInventory = stockAgg.length ? stockAgg[0].total : 0;
    return res.json(new ApiResponse_1.ApiResponse(200, {
        totalInventory,
        lowStockAlerts: lowStockCount,
        pendingReceiving: pendingReceivingCount,
        activeTransfers,
        recentOptimizations,
    }, 'Warehouse stats fetched'));
});
/**
 * GET /api/dashboard/procurement-stats
 * Returns PO counts and spend metrics for the procurement dashboard.
 */
exports.getProcurementStats = (0, utils_1.asyncHandler)(async (_req, res) => {
    // Month-to-date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [pendingApprovals, openOrders, fulfilledThisMonth, spendAgg] = await Promise.all([
        model_6.default.countDocuments({ status: 'pending_approval' }),
        model_6.default.countDocuments({
            status: { $in: ['sent_to_supplier', 'acknowledged', 'partially_received'] },
        }),
        model_6.default.countDocuments({
            status: 'fully_received',
            updatedAt: { $gte: startOfMonth },
        }),
        model_6.default.aggregate([
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
    return res.json(new ApiResponse_1.ApiResponse(200, {
        pendingApprovals,
        openOrders,
        fulfilledThisMonth,
        totalSpendMTD,
    }, 'Procurement stats fetched'));
});
/**
 * GET /api/dashboard/agent-stats
 * Returns recent AI agent activity for the agent monitor page.
 */
exports.getAgentStats = (0, utils_1.asyncHandler)(async (_req, res) => {
    const [recentForecasts, latestOptimization, totalForecasts, totalOptimizations] = await Promise.all([
        model_7.default.find()
            .sort({ forecastedAt: -1 })
            .limit(10)
            .populate('product', 'name sku')
            .populate('warehouse', 'name code')
            .lean(),
        model_8.default.findOne()
            .sort({ generatedAt: -1 })
            .lean(),
        model_7.default.countDocuments(),
        model_8.default.countDocuments(),
    ]);
    return res.json(new ApiResponse_1.ApiResponse(200, {
        recentForecasts,
        latestOptimization,
        totalForecasts,
        totalOptimizations,
    }, 'Agent stats fetched'));
});
