"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Agent API routes — endpoints to trigger Mastra agents and fetch their results.
 * These routes call the Mastra AI module via HTTP (mastra dev runs on port 4111).
 * Every invocation is tracked via the AgentRun collection.
 *
 * Base path: /api/agents
 */
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const model_1 = __importDefault(require("@/modules/negotiation/model"));
const model_2 = __importDefault(require("@/modules/forecast/model"));
const model_3 = __importDefault(require("@/modules/warehouse-optimization/model"));
const model_4 = __importDefault(require("@/modules/blockchain/model"));
const agent_run_model_1 = __importDefault(require("@/modules/agents/agent-run.model"));
const reorder_recommendation_model_1 = __importDefault(require("@/modules/agents/reorder-recommendation.model"));
const agent_registry_1 = require("@/modules/agents/agent-registry");
const utils_1 = require("@/utils");
const auth_1 = require("@/middlewares/auth");
const router = (0, express_1.Router)();
const MASTRA_URL = process.env.MASTRA_URL || 'http://localhost:4111';
/**
 * Wraps a Mastra workflow call with AgentRun tracking.
 * Creates an AgentRun doc before the call, updates it on completion/failure.
 */
async function triggerWorkflow(agentId, workflowId, input, userId) {
    const run = await agent_run_model_1.default.create({
        agentId,
        workflowId,
        status: 'running',
        startedAt: new Date(),
        input,
        triggeredBy: userId,
    });
    const startMs = Date.now();
    try {
        const runRes = await axios_1.default.post(`${MASTRA_URL}/api/workflows/${workflowId}/create-run`, {});
        const mastraRunId = runRes.data?.runId;
        if (!mastraRunId)
            throw new Error(`Failed to create Mastra run for ${workflowId}`);
        const res = await axios_1.default.post(`${MASTRA_URL}/api/workflows/${workflowId}/start-async?runId=${mastraRunId}`, { inputData: input }, { timeout: 600000 });
        const durationMs = Date.now() - startMs;
        const workflowStatus = res.data?.status;
        const success = workflowStatus === 'success';
        await agent_run_model_1.default.findByIdAndUpdate(run._id, {
            status: success ? 'success' : 'failed',
            completedAt: new Date(),
            durationMs,
            mastraRunId,
            output: res.data,
            error: success ? undefined : (res.data?.error?.message || 'Workflow returned non-success status'),
        });
        return res.data;
    }
    catch (err) {
        const durationMs = Date.now() - startMs;
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        await agent_run_model_1.default.findByIdAndUpdate(run._id, {
            status: isTimeout ? 'timeout' : 'failed',
            completedAt: new Date(),
            durationMs,
            error: err.message || 'Unknown error',
        });
        throw err;
    }
}
/**
 * Aggregate real stats for all agents from the AgentRun collection.
 */
async function getAgentStats() {
    const stats = await agent_run_model_1.default.aggregate([
        {
            $group: {
                _id: '$agentId',
                totalRuns: { $sum: 1 },
                successfulRuns: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
                failedRuns: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                avgDurationMs: { $avg: '$durationMs' },
                maxDurationMs: { $max: '$durationMs' },
                minDurationMs: { $min: '$durationMs' },
                lastRunAt: { $max: '$startedAt' },
            },
        },
    ]);
    const byAgentId = new Map();
    stats.forEach((s) => byAgentId.set(s._id, s));
    return byAgentId;
}
function formatDuration(ms) {
    if (!ms || ms < 1000)
        return `${ms || 0}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remSec = seconds % 60;
    if (minutes < 60)
        return `${minutes}m ${remSec}s`;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    return `${hours}h ${remMin}m`;
}
// ── Agent Status ─────────────────────────────────────────────────────────────
// GET /api/agents/status — Dashboard summary with real stats from AgentRun
router.get('/status', auth_1.authenticate, (0, utils_1.asyncHandler)(async (_req, res) => {
    const [forecastCount, optimizationCount, negotiationCount, blockchainCount, agentStatsMap, recentNegotiations, totalExecution,] = await Promise.all([
        model_2.default.countDocuments(),
        model_3.default.countDocuments(),
        model_1.default.countDocuments(),
        model_4.default.countDocuments(),
        getAgentStats(),
        model_1.default.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('supplier', 'companyName')
            .populate('product', 'name sku')
            .lean(),
        agent_run_model_1.default.aggregate([
            { $match: { durationMs: { $exists: true } } },
            { $group: { _id: null, total: { $sum: '$durationMs' } } },
        ]),
    ]);
    // Build agent list from the registry with real runtime stats
    const agents = agent_registry_1.ALL_AGENT_IDS.map((id) => {
        const meta = agent_registry_1.AGENT_REGISTRY[id];
        const runStats = agentStatsMap.get(id) || {};
        return {
            id,
            name: meta.name,
            description: meta.description,
            category: meta.category,
            stateful: meta.stateful,
            model: meta.model,
            framework: meta.framework,
            status: 'active',
            totalRuns: runStats.totalRuns || 0,
            successfulRuns: runStats.successfulRuns || 0,
            failedRuns: runStats.failedRuns || 0,
            successRate: runStats.totalRuns > 0
                ? Math.round((runStats.successfulRuns / runStats.totalRuns) * 100)
                : null,
            avgDurationMs: runStats.avgDurationMs ? Math.round(runStats.avgDurationMs) : null,
            avgDurationHuman: runStats.avgDurationMs ? formatDuration(Math.round(runStats.avgDurationMs)) : null,
            maxDurationMs: runStats.maxDurationMs || null,
            minDurationMs: runStats.minDurationMs || null,
            lastRunAt: runStats.lastRunAt || null,
        };
    });
    const totalMs = totalExecution[0]?.total || 0;
    const totalRuns = agents.reduce((sum, a) => sum + a.totalRuns, 0);
    const totalSuccess = agents.reduce((sum, a) => sum + a.successfulRuns, 0);
    return (0, utils_1.sendSuccess)(res, {
        agents,
        recentNegotiations,
        stats: {
            totalForecasts: forecastCount,
            totalOptimizations: optimizationCount,
            totalNegotiations: negotiationCount,
            totalBlockchainLogs: blockchainCount,
            totalAgentRuns: totalRuns,
            totalSuccessfulRuns: totalSuccess,
            overallSuccessRate: totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : null,
            totalExecutionMs: totalMs,
            totalExecutionHuman: formatDuration(totalMs),
        },
    });
}));
// GET /api/agents/runs/all — Global run history across all agents
router.get('/runs/all', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { limit = 30 } = req.query;
    const runs = await agent_run_model_1.default.find()
        .sort({ startedAt: -1 })
        .limit(Number(limit))
        .populate('triggeredBy', 'name email')
        .lean();
    return (0, utils_1.sendSuccess)(res, runs);
}));
// GET /api/agents/:agentId — Full details for one agent
router.get('/:agentId', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { agentId } = req.params;
    const meta = agent_registry_1.AGENT_REGISTRY[agentId];
    if (!meta) {
        return res.status(404).json({ message: `Agent ${agentId} not found` });
    }
    const [runStats, recentRuns, statusCounts] = await Promise.all([
        agent_run_model_1.default.aggregate([
            { $match: { agentId } },
            {
                $group: {
                    _id: null,
                    totalRuns: { $sum: 1 },
                    successfulRuns: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
                    failedRuns: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    timeoutRuns: { $sum: { $cond: [{ $eq: ['$status', 'timeout'] }, 1, 0] } },
                    avgDurationMs: { $avg: '$durationMs' },
                    maxDurationMs: { $max: '$durationMs' },
                    minDurationMs: { $min: '$durationMs' },
                    totalDurationMs: { $sum: '$durationMs' },
                    firstRunAt: { $min: '$startedAt' },
                    lastRunAt: { $max: '$startedAt' },
                },
            },
        ]),
        agent_run_model_1.default.find({ agentId })
            .sort({ startedAt: -1 })
            .limit(10)
            .select('status startedAt completedAt durationMs input error mastraRunId')
            .lean(),
        agent_run_model_1.default.aggregate([
            { $match: { agentId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
    ]);
    const stats = runStats[0] || {};
    const statusBreakdown = {};
    statusCounts.forEach((s) => {
        statusBreakdown[s._id] = s.count;
    });
    return (0, utils_1.sendSuccess)(res, {
        metadata: meta,
        stats: {
            totalRuns: stats.totalRuns || 0,
            successfulRuns: stats.successfulRuns || 0,
            failedRuns: stats.failedRuns || 0,
            timeoutRuns: stats.timeoutRuns || 0,
            successRate: stats.totalRuns > 0
                ? Math.round((stats.successfulRuns / stats.totalRuns) * 100)
                : null,
            avgDurationMs: stats.avgDurationMs ? Math.round(stats.avgDurationMs) : null,
            avgDurationHuman: stats.avgDurationMs ? formatDuration(Math.round(stats.avgDurationMs)) : null,
            maxDurationMs: stats.maxDurationMs || null,
            maxDurationHuman: stats.maxDurationMs ? formatDuration(stats.maxDurationMs) : null,
            minDurationMs: stats.minDurationMs || null,
            minDurationHuman: stats.minDurationMs ? formatDuration(stats.minDurationMs) : null,
            totalDurationMs: stats.totalDurationMs || 0,
            totalDurationHuman: formatDuration(stats.totalDurationMs || 0),
            firstRunAt: stats.firstRunAt || null,
            lastRunAt: stats.lastRunAt || null,
            statusBreakdown,
        },
        recentRuns,
    });
}));
// GET /api/agents/:agentId/runs — Paginated run history for a specific agent
router.get('/:agentId/runs', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { agentId } = req.params;
    const { limit = 50, status } = req.query;
    const filter = { agentId };
    if (status)
        filter.status = status;
    const runs = await agent_run_model_1.default.find(filter)
        .sort({ startedAt: -1 })
        .limit(Number(limit))
        .populate('triggeredBy', 'name email')
        .lean();
    return (0, utils_1.sendSuccess)(res, runs);
}));
// ── Negotiation ──────────────────────────────────────────────────────────────
router.post('/negotiation/trigger', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { productId, warehouseId, requiredQty, maxUnitPrice, targetUnitPrice, maxLeadTimeDays } = req.body;
    const userId = req.user?.userId;
    const result = await triggerWorkflow('negotiation-agent', 'negotiationWorkflow', {
        productId,
        warehouseId,
        requiredQty,
        maxUnitPrice,
        targetUnitPrice,
        maxLeadTimeDays,
        initiatedBy: 'procurement_officer',
    }, userId);
    return (0, utils_1.sendSuccess)(res, result, 'Negotiation workflow triggered');
}));
router.get('/negotiation/sessions', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { status, limit = 20 } = req.query;
    const filter = {};
    if (status)
        filter.status = status;
    const sessions = await model_1.default.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .populate('supplier', 'companyName contactEmail')
        .populate('product', 'name sku')
        .lean();
    return (0, utils_1.sendSuccess)(res, sessions);
}));
router.get('/negotiation/sessions/:id', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const session = await model_1.default.findById(req.params.id)
        .populate('supplier', 'companyName contactEmail rating')
        .populate('product', 'name sku')
        .lean();
    if (!session) {
        return res.status(404).json({ message: 'Negotiation session not found' });
    }
    return (0, utils_1.sendSuccess)(res, session);
}));
// DELETE /api/agents/negotiation/sessions/:id — Admin only
router.delete('/negotiation/sessions/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, utils_1.asyncHandler)(async (req, res) => {
    const deleted = await model_1.default.findByIdAndDelete(req.params.id);
    if (!deleted) {
        return res.status(404).json({ message: 'Negotiation session not found' });
    }
    return (0, utils_1.sendSuccess)(res, { _id: req.params.id }, 'Negotiation session deleted');
}));
// POST /api/agents/negotiation/sessions/cleanup — Admin only: remove broken/dummy sessions
router.post('/negotiation/sessions/cleanup', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, utils_1.asyncHandler)(async (_req, res) => {
    // Delete sessions where supplier or product references are broken (populate returns null)
    const all = await model_1.default.find()
        .populate('supplier', 'companyName')
        .populate('product', 'name')
        .lean();
    const brokenIds = all
        .filter((s) => !s.supplier || !s.product)
        .map((s) => s._id);
    if (brokenIds.length > 0) {
        await model_1.default.deleteMany({ _id: { $in: brokenIds } });
    }
    // Also mark any in_progress sessions older than 10 minutes as timed_out
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const timeoutResult = await model_1.default.updateMany({ status: 'in_progress', createdAt: { $lt: tenMinAgo } }, { $set: { status: 'timed_out', completedAt: new Date() } });
    return (0, utils_1.sendSuccess)(res, {
        deletedCount: brokenIds.length,
        deletedIds: brokenIds,
        timedOutCount: timeoutResult.modifiedCount,
    }, 'Cleanup complete');
}));
// ── Procurement Orchestrator ─────────────────────────────────────────────────
router.post('/procurement/check', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { productId, warehouseId } = req.body;
    const userId = req.user?.userId;
    const result = await triggerWorkflow('procurement-orchestrator-agent', 'procurementWorkflow', { productId, warehouseId }, userId);
    return (0, utils_1.sendSuccess)(res, result, 'Procurement check completed');
}));
// ── Supplier Evaluation ──────────────────────────────────────────────────────
router.post('/supplier-evaluation/run', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await triggerWorkflow('supplier-evaluation-agent', 'supplierEvaluationWorkflow', {}, userId);
    return (0, utils_1.sendSuccess)(res, result, 'Supplier evaluation completed');
}));
// ── Anomaly Detection ────────────────────────────────────────────────────────
router.post('/anomaly-detection/scan', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await triggerWorkflow('anomaly-detection-agent', 'anomalyDetectionWorkflow', {}, userId);
    return (0, utils_1.sendSuccess)(res, result, 'Anomaly scan completed');
}));
// ── Smart Reorder ────────────────────────────────────────────────────────────
router.post('/smart-reorder/run', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const result = await triggerWorkflow('smart-reorder-agent', 'smartReorderWorkflow', {}, userId);
    return (0, utils_1.sendSuccess)(res, result, 'Smart reorder analysis completed');
}));
// GET /api/agents/smart-reorder/recommendations — List recommendations
router.get('/smart-reorder/recommendations', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { status = 'pending', urgency, limit = 100 } = req.query;
    const filter = {};
    if (status && status !== 'all')
        filter.status = status;
    if (urgency)
        filter.urgency = urgency;
    const recommendations = await reorder_recommendation_model_1.default.find(filter)
        .sort({ urgency: 1, daysUntilStockout: 1, createdAt: -1 })
        .limit(Number(limit))
        .populate('product', 'name sku category unit')
        .populate('warehouse', 'name code')
        .populate('actedOnBy', 'name email')
        .lean();
    // Urgency order: critical > high > medium > low
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9) ||
        a.daysUntilStockout - b.daysUntilStockout);
    return (0, utils_1.sendSuccess)(res, recommendations);
}));
// POST /api/agents/smart-reorder/recommendations/:id/order — Trigger negotiation
router.post('/smart-reorder/recommendations/:id/order', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const rec = await reorder_recommendation_model_1.default.findById(id);
    if (!rec) {
        return res.status(404).json({ message: 'Recommendation not found' });
    }
    if (rec.status !== 'pending') {
        return res.status(400).json({ message: `Recommendation is already ${rec.status}` });
    }
    if (rec.supplierCount === 0) {
        return res.status(400).json({
            message: 'No approved suppliers available for this product. Add a supplier first.',
        });
    }
    // Compute negotiation parameters from the recommendation
    // maxUnitPrice = 5% buffer above minSupplierPrice; target = 15% below
    const basePrice = rec.minSupplierPrice || rec.estimatedUnitPrice;
    const maxUnitPrice = Math.ceil(basePrice * 1.05);
    const targetUnitPrice = Math.ceil(basePrice * 0.85);
    const maxLeadTimeDays = Math.max(rec.daysUntilStockout - 1, 3);
    // Mark the recommendation as in_negotiation first
    rec.status = 'in_negotiation';
    rec.actedOnBy = userId;
    rec.actedOnAt = new Date();
    await rec.save();
    try {
        const result = await triggerWorkflow('negotiation-agent', 'negotiationWorkflow', {
            productId: rec.product.toString(),
            warehouseId: rec.warehouse.toString(),
            requiredQty: rec.recommendedQty,
            maxUnitPrice,
            targetUnitPrice,
            maxLeadTimeDays,
            initiatedBy: 'auto_replenishment',
        }, userId);
        // If the negotiation succeeded and created a PO, link it
        const poId = result?.result?.purchaseOrderId || result?.purchaseOrderId;
        const negotiationId = result?.result?.negotiationIds?.[0] || result?.negotiationIds?.[0];
        if (poId) {
            rec.status = 'ordered';
            rec.purchaseOrderId = poId;
        }
        if (negotiationId) {
            rec.negotiationSessionId = negotiationId;
        }
        await rec.save();
        return (0, utils_1.sendSuccess)(res, { recommendation: rec, negotiationResult: result }, 'Negotiation triggered');
    }
    catch (err) {
        // Revert status on failure so user can retry
        rec.status = 'pending';
        rec.actedOnBy = undefined;
        rec.actedOnAt = undefined;
        await rec.save();
        throw err;
    }
}));
// POST /api/agents/smart-reorder/recommendations/:id/reject — Reject
router.post('/smart-reorder/recommendations/:id/reject', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { notes } = req.body || {};
    const rec = await reorder_recommendation_model_1.default.findByIdAndUpdate(id, {
        status: 'rejected',
        actedOnBy: userId,
        actedOnAt: new Date(),
        notes,
    }, { new: true });
    if (!rec) {
        return res.status(404).json({ message: 'Recommendation not found' });
    }
    return (0, utils_1.sendSuccess)(res, rec, 'Recommendation rejected');
}));
// ── Quality Control ──────────────────────────────────────────────────────────
router.post('/quality-control/verify', auth_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { purchaseOrderId, receivedItems } = req.body;
    const userId = req.user?.userId;
    const result = await triggerWorkflow('quality-control-agent', 'qualityControlWorkflow', { purchaseOrderId, receivedItems }, userId);
    return (0, utils_1.sendSuccess)(res, result, 'Quality control verification completed');
}));
// ── Blockchain Logs (Admin only) ─────────────────────────────────────────────
router.get('/blockchain/logs', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, utils_1.asyncHandler)(async (req, res) => {
    const { referenceModel, eventType, limit = 20 } = req.query;
    const filter = {};
    if (referenceModel)
        filter.referenceModel = referenceModel;
    if (eventType)
        filter.eventType = eventType;
    const logs = await model_4.default.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();
    return (0, utils_1.sendSuccess)(res, logs);
}));
exports.default = router;
