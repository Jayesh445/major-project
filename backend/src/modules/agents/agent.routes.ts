/**
 * Agent API routes — endpoints to trigger Mastra agents and fetch their results.
 * These routes call the Mastra AI module via HTTP (mastra dev runs on port 4111).
 * Every invocation is tracked via the AgentRun collection.
 *
 * Base path: /api/agents
 */
import { Router, Request, Response } from 'express';
import axios from 'axios';
import NegotiationSession from '@/modules/negotiation/model';
import DemandForecast from '@/modules/forecast/model';
import WarehouseOptimizationRecommendation from '@/modules/warehouse-optimization/model';
import BlockchainLog from '@/modules/blockchain/model';
import AgentRun from '@/modules/agents/agent-run.model';
import ReorderRecommendation from '@/modules/agents/reorder-recommendation.model';
import { AGENT_REGISTRY, ALL_AGENT_IDS } from '@/modules/agents/agent-registry';
import { asyncHandler, sendSuccess } from '@/utils';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

const MASTRA_URL = process.env.MASTRA_URL || 'http://localhost:4111';

/**
 * Wraps a Mastra workflow call with AgentRun tracking.
 * Creates an AgentRun doc before the call, updates it on completion/failure.
 */
async function triggerWorkflow(
  agentId: string,
  workflowId: string,
  input: any,
  userId?: string
) {
  const run = await AgentRun.create({
    agentId,
    workflowId,
    status: 'running',
    startedAt: new Date(),
    input,
    triggeredBy: userId,
  });

  const startMs = Date.now();

  try {
    const runRes = await axios.post(
      `${MASTRA_URL}/api/workflows/${workflowId}/create-run`,
      {}
    );
    const mastraRunId = runRes.data?.runId;
    if (!mastraRunId) throw new Error(`Failed to create Mastra run for ${workflowId}`);

    const res = await axios.post(
      `${MASTRA_URL}/api/workflows/${workflowId}/start-async?runId=${mastraRunId}`,
      { inputData: input },
      { timeout: 600000 }
    );

    const durationMs = Date.now() - startMs;
    const workflowStatus = res.data?.status;
    const success = workflowStatus === 'success';

    await AgentRun.findByIdAndUpdate(run._id, {
      status: success ? 'success' : 'failed',
      completedAt: new Date(),
      durationMs,
      mastraRunId,
      output: res.data,
      error: success ? undefined : (res.data?.error?.message || 'Workflow returned non-success status'),
    });

    return res.data;
  } catch (err: any) {
    const durationMs = Date.now() - startMs;
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');

    await AgentRun.findByIdAndUpdate(run._id, {
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
  const stats = await AgentRun.aggregate([
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

  const byAgentId = new Map<string, any>();
  stats.forEach((s: any) => byAgentId.set(s._id, s));
  return byAgentId;
}

function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return `${ms || 0}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSec}s`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
}

// ── Agent Status ─────────────────────────────────────────────────────────────

// GET /api/agents/status — Dashboard summary with real stats from AgentRun
router.get(
  '/status',
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      forecastCount,
      optimizationCount,
      negotiationCount,
      blockchainCount,
      agentStatsMap,
      recentNegotiations,
      totalExecution,
    ] = await Promise.all([
      DemandForecast.countDocuments(),
      WarehouseOptimizationRecommendation.countDocuments(),
      NegotiationSession.countDocuments(),
      BlockchainLog.countDocuments(),
      getAgentStats(),
      NegotiationSession.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('supplier', 'companyName')
        .populate('product', 'name sku')
        .lean(),
      AgentRun.aggregate([
        { $match: { durationMs: { $exists: true } } },
        { $group: { _id: null, total: { $sum: '$durationMs' } } },
      ]),
    ]);

    // Build agent list from the registry with real runtime stats
    const agents = ALL_AGENT_IDS.map((id) => {
      const meta = AGENT_REGISTRY[id];
      const runStats: any = agentStatsMap.get(id) || {};
      return {
        id,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        stateful: meta.stateful,
        model: meta.model,
        framework: meta.framework,
        status: 'active' as const,
        totalRuns: runStats.totalRuns || 0,
        successfulRuns: runStats.successfulRuns || 0,
        failedRuns: runStats.failedRuns || 0,
        successRate:
          runStats.totalRuns > 0
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

    return sendSuccess(res, {
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
  })
);

// GET /api/agents/runs/all — Global run history across all agents
router.get(
  '/runs/all',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = 30 } = req.query;

    const runs = await AgentRun.find()
      .sort({ startedAt: -1 })
      .limit(Number(limit))
      .populate('triggeredBy', 'name email')
      .lean();

    return sendSuccess(res, runs);
  })
);

// GET /api/agents/:agentId — Full details for one agent
router.get(
  '/:agentId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;
    const meta = AGENT_REGISTRY[agentId];
    if (!meta) {
      return res.status(404).json({ message: `Agent ${agentId} not found` });
    }

    const [runStats, recentRuns, statusCounts] = await Promise.all([
      AgentRun.aggregate([
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
      AgentRun.find({ agentId })
        .sort({ startedAt: -1 })
        .limit(10)
        .select('status startedAt completedAt durationMs input error mastraRunId')
        .lean(),
      AgentRun.aggregate([
        { $match: { agentId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const stats: any = runStats[0] || {};
    const statusBreakdown: Record<string, number> = {};
    statusCounts.forEach((s: any) => {
      statusBreakdown[s._id] = s.count;
    });

    return sendSuccess(res, {
      metadata: meta,
      stats: {
        totalRuns: stats.totalRuns || 0,
        successfulRuns: stats.successfulRuns || 0,
        failedRuns: stats.failedRuns || 0,
        timeoutRuns: stats.timeoutRuns || 0,
        successRate:
          stats.totalRuns > 0
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
  })
);

// GET /api/agents/:agentId/runs — Paginated run history for a specific agent
router.get(
  '/:agentId/runs',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { agentId } = req.params;
    const { limit = 50, status } = req.query;
    const filter: any = { agentId };
    if (status) filter.status = status;

    const runs = await AgentRun.find(filter)
      .sort({ startedAt: -1 })
      .limit(Number(limit))
      .populate('triggeredBy', 'name email')
      .lean();

    return sendSuccess(res, runs);
  })
);

// ── Negotiation ──────────────────────────────────────────────────────────────

router.post(
  '/negotiation/trigger',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, warehouseId, requiredQty, maxUnitPrice, targetUnitPrice, maxLeadTimeDays } = req.body;
    const userId = (req as any).user?.userId;

    const result = await triggerWorkflow(
      'negotiation-agent',
      'negotiationWorkflow',
      {
        productId,
        warehouseId,
        requiredQty,
        maxUnitPrice,
        targetUnitPrice,
        maxLeadTimeDays,
        initiatedBy: 'procurement_officer',
      },
      userId
    );

    return sendSuccess(res, result, 'Negotiation workflow triggered');
  })
);

router.get(
  '/negotiation/sessions',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const sessions = await NegotiationSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('supplier', 'companyName contactEmail')
      .populate('product', 'name sku')
      .lean();

    return sendSuccess(res, sessions);
  })
);

router.get(
  '/negotiation/sessions/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const session = await NegotiationSession.findById(req.params.id)
      .populate('supplier', 'companyName contactEmail rating')
      .populate('product', 'name sku')
      .lean();

    if (!session) {
      return res.status(404).json({ message: 'Negotiation session not found' });
    }

    return sendSuccess(res, session);
  })
);

// DELETE /api/agents/negotiation/sessions/:id — Admin only
router.delete(
  '/negotiation/sessions/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await NegotiationSession.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Negotiation session not found' });
    }
    return sendSuccess(res, { _id: req.params.id }, 'Negotiation session deleted');
  })
);

// POST /api/agents/negotiation/sessions/cleanup — Admin only: remove broken/dummy sessions
router.post(
  '/negotiation/sessions/cleanup',
  authenticate,
  authorize('admin'),
  asyncHandler(async (_req: Request, res: Response) => {
    // Delete sessions where supplier or product references are broken (populate returns null)
    const all = await NegotiationSession.find()
      .populate('supplier', 'companyName')
      .populate('product', 'name')
      .lean();

    const brokenIds = all
      .filter((s: any) => !s.supplier || !s.product)
      .map((s: any) => s._id);

    if (brokenIds.length > 0) {
      await NegotiationSession.deleteMany({ _id: { $in: brokenIds } });
    }

    // Also mark any in_progress sessions older than 10 minutes as timed_out
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const timeoutResult = await NegotiationSession.updateMany(
      { status: 'in_progress', createdAt: { $lt: tenMinAgo } },
      { $set: { status: 'timed_out', completedAt: new Date() } }
    );

    return sendSuccess(
      res,
      {
        deletedCount: brokenIds.length,
        deletedIds: brokenIds,
        timedOutCount: timeoutResult.modifiedCount,
      },
      'Cleanup complete'
    );
  })
);

// ── Procurement Orchestrator ─────────────────────────────────────────────────

router.post(
  '/procurement/check',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, warehouseId } = req.body;
    const userId = (req as any).user?.userId;

    const result = await triggerWorkflow(
      'procurement-orchestrator-agent',
      'procurementWorkflow',
      { productId, warehouseId },
      userId
    );

    return sendSuccess(res, result, 'Procurement check completed');
  })
);

// ── Supplier Evaluation ──────────────────────────────────────────────────────

router.post(
  '/supplier-evaluation/run',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await triggerWorkflow(
      'supplier-evaluation-agent',
      'supplierEvaluationWorkflow',
      {},
      userId
    );
    return sendSuccess(res, result, 'Supplier evaluation completed');
  })
);

// ── Anomaly Detection ────────────────────────────────────────────────────────

router.post(
  '/anomaly-detection/scan',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await triggerWorkflow(
      'anomaly-detection-agent',
      'anomalyDetectionWorkflow',
      {},
      userId
    );
    return sendSuccess(res, result, 'Anomaly scan completed');
  })
);

// ── Smart Reorder ────────────────────────────────────────────────────────────

router.post(
  '/smart-reorder/run',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    const result = await triggerWorkflow(
      'smart-reorder-agent',
      'smartReorderWorkflow',
      {},
      userId
    );
    return sendSuccess(res, result, 'Smart reorder analysis completed');
  })
);

// GET /api/agents/smart-reorder/recommendations — List recommendations
router.get(
  '/smart-reorder/recommendations',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status = 'pending', urgency, limit = 100 } = req.query;
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (urgency) filter.urgency = urgency;

    const recommendations = await ReorderRecommendation.find(filter)
      .sort({ urgency: 1, daysUntilStockout: 1, createdAt: -1 })
      .limit(Number(limit))
      .populate('product', 'name sku category unit')
      .populate('warehouse', 'name code')
      .populate('actedOnBy', 'name email')
      .lean();

    // Urgency order: critical > high > medium > low
    const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort(
      (a: any, b: any) =>
        (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9) ||
        a.daysUntilStockout - b.daysUntilStockout
    );

    return sendSuccess(res, recommendations);
  })
);

// POST /api/agents/smart-reorder/recommendations/:id/order — Trigger negotiation
router.post(
  '/smart-reorder/recommendations/:id/order',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const rec = await ReorderRecommendation.findById(id);
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
    rec.actedOnBy = userId as any;
    rec.actedOnAt = new Date();
    await rec.save();

    try {
      const result = await triggerWorkflow(
        'negotiation-agent',
        'negotiationWorkflow',
        {
          productId: rec.product.toString(),
          warehouseId: rec.warehouse.toString(),
          requiredQty: rec.recommendedQty,
          maxUnitPrice,
          targetUnitPrice,
          maxLeadTimeDays,
          initiatedBy: 'auto_replenishment',
        },
        userId
      );

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

      return sendSuccess(res, { recommendation: rec, negotiationResult: result }, 'Negotiation triggered');
    } catch (err: any) {
      // Revert status on failure so user can retry
      rec.status = 'pending';
      rec.actedOnBy = undefined as any;
      rec.actedOnAt = undefined;
      await rec.save();
      throw err;
    }
  })
);

// POST /api/agents/smart-reorder/recommendations/:id/reject — Reject
router.post(
  '/smart-reorder/recommendations/:id/reject',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { notes } = req.body || {};

    const rec = await ReorderRecommendation.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        actedOnBy: userId,
        actedOnAt: new Date(),
        notes,
      },
      { new: true }
    );

    if (!rec) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    return sendSuccess(res, rec, 'Recommendation rejected');
  })
);

// ── Quality Control ──────────────────────────────────────────────────────────

router.post(
  '/quality-control/verify',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { purchaseOrderId, receivedItems } = req.body;
    const userId = (req as any).user?.userId;

    const result = await triggerWorkflow(
      'quality-control-agent',
      'qualityControlWorkflow',
      { purchaseOrderId, receivedItems },
      userId
    );

    return sendSuccess(res, result, 'Quality control verification completed');
  })
);

// ── Blockchain Logs (Admin only) ─────────────────────────────────────────────

router.get(
  '/blockchain/logs',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { referenceModel, eventType, limit = 20 } = req.query;
    const filter: any = {};
    if (referenceModel) filter.referenceModel = referenceModel;
    if (eventType) filter.eventType = eventType;

    const logs = await BlockchainLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return sendSuccess(res, logs);
  })
);

export default router;
