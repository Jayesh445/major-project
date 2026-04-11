/**
 * Agent API routes — endpoints to trigger Mastra agents and fetch their results.
 * These routes call the Mastra AI module via HTTP (mastra dev runs on port 4111).
 *
 * Base path: /api/agents
 */
import { Router, Request, Response } from 'express';
import axios from 'axios';
import NegotiationSession from '@/modules/negotiation/model';
import DemandForecast from '@/modules/forecast/model';
import WarehouseOptimizationRecommendation from '@/modules/warehouse-optimization/model';
import BlockchainLog from '@/modules/blockchain/model';
import { asyncHandler, sendSuccess } from '@/utils';

const router = Router();

const MASTRA_URL = process.env.MASTRA_URL || 'http://localhost:4111';

// Helper to call Mastra workflows
// Mastra requires: 1) create-run to get runId, 2) start-async with runId as query param
async function triggerWorkflow(workflowId: string, input: any) {
  // Step 1: create a run
  const runRes = await axios.post(`${MASTRA_URL}/api/workflows/${workflowId}/create-run`, {});
  const runId = runRes.data?.runId;
  if (!runId) throw new Error(`Failed to create run for workflow ${workflowId}`);

  // Step 2: start the run and wait for completion
  const res = await axios.post(
    `${MASTRA_URL}/api/workflows/${workflowId}/start-async?runId=${runId}`,
    { inputData: input },
    { timeout: 600000 } // 10 min timeout for long-running agents
  );
  return res.data;
}

// Helper to call Mastra agents directly
async function callAgent(agentId: string, messages: any[]) {
  const res = await axios.post(`${MASTRA_URL}/api/agents/${agentId}/generate`, {
    messages,
  });
  return res.data;
}

// ── Agent Status ─────────────────────────────────────────────────────────────

// GET /api/agents/status — Status of all agents
router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    const [
      forecastCount,
      optimizationCount,
      negotiationCount,
      blockchainCount,
    ] = await Promise.all([
      DemandForecast.countDocuments(),
      WarehouseOptimizationRecommendation.countDocuments(),
      NegotiationSession.countDocuments(),
      BlockchainLog.countDocuments(),
    ]);

    const recentNegotiations = await NegotiationSession.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('supplier', 'companyName')
      .populate('product', 'name sku')
      .lean();

    const agents = [
      { id: 'forecast-agent', name: 'Demand Forecast Agent', status: 'active', totalRuns: forecastCount },
      { id: 'warehouse-optimization-agent', name: 'Warehouse Optimization Agent', status: 'active', totalRuns: optimizationCount },
      { id: 'negotiation-agent', name: 'Buyer Negotiation Agent', status: 'active', totalRuns: negotiationCount },
      { id: 'supplier-simulator-agent', name: 'Supplier Simulator Agent', status: 'active', totalRuns: negotiationCount },
      { id: 'procurement-orchestrator-agent', name: 'Procurement Orchestrator Agent', status: 'active', totalRuns: 0 },
      { id: 'supplier-evaluation-agent', name: 'Supplier Evaluation Agent', status: 'active', totalRuns: 0 },
      { id: 'anomaly-detection-agent', name: 'Anomaly Detection Agent', status: 'active', totalRuns: 0 },
      { id: 'smart-reorder-agent', name: 'Smart Reorder Agent', status: 'active', totalRuns: 0 },
      { id: 'quality-control-agent', name: 'Quality Control Agent', status: 'active', totalRuns: blockchainCount },
    ];

    return sendSuccess(res, {
      agents,
      recentNegotiations,
      stats: {
        totalForecasts: forecastCount,
        totalOptimizations: optimizationCount,
        totalNegotiations: negotiationCount,
        totalBlockchainLogs: blockchainCount,
      },
    });
  })
);

// ── Negotiation ──────────────────────────────────────────────────────────────

// POST /api/agents/negotiation/trigger — Trigger a new negotiation
router.post(
  '/negotiation/trigger',
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, warehouseId, requiredQty, maxUnitPrice, targetUnitPrice, maxLeadTimeDays } = req.body;

    const result = await triggerWorkflow('negotiationWorkflow', {
      productId,
      warehouseId,
      requiredQty,
      maxUnitPrice,
      targetUnitPrice,
      maxLeadTimeDays,
      initiatedBy: 'procurement_officer',
    });

    return sendSuccess(res, result, 'Negotiation workflow triggered');
  })
);

// GET /api/agents/negotiation/sessions — List all negotiation sessions
router.get(
  '/negotiation/sessions',
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

// GET /api/agents/negotiation/sessions/:id — Get negotiation with full rounds
router.get(
  '/negotiation/sessions/:id',
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

// ── Procurement Orchestrator ─────────────────────────────────────────────────

// POST /api/agents/procurement/check — Check replenishment need
router.post(
  '/procurement/check',
  asyncHandler(async (req: Request, res: Response) => {
    const { productId, warehouseId } = req.body;

    const result = await triggerWorkflow('procurementWorkflow', {
      productId,
      warehouseId,
    });

    return sendSuccess(res, result, 'Procurement check completed');
  })
);

// ── Supplier Evaluation ──────────────────────────────────────────────────────

// POST /api/agents/supplier-evaluation/run — Run supplier evaluation
router.post(
  '/supplier-evaluation/run',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await triggerWorkflow('supplierEvaluationWorkflow', {});
    return sendSuccess(res, result, 'Supplier evaluation completed');
  })
);

// ── Anomaly Detection ────────────────────────────────────────────────────────

// POST /api/agents/anomaly-detection/scan — Run anomaly scan
router.post(
  '/anomaly-detection/scan',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await triggerWorkflow('anomalyDetectionWorkflow', {});
    return sendSuccess(res, result, 'Anomaly scan completed');
  })
);

// ── Smart Reorder ────────────────────────────────────────────────────────────

// POST /api/agents/smart-reorder/run — Run smart reorder analysis
router.post(
  '/smart-reorder/run',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await triggerWorkflow('smartReorderWorkflow', {});
    return sendSuccess(res, result, 'Smart reorder analysis completed');
  })
);

// ── Quality Control ──────────────────────────────────────────────────────────

// POST /api/agents/quality-control/verify — Verify goods receipt
router.post(
  '/quality-control/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { purchaseOrderId, receivedItems } = req.body;

    const result = await triggerWorkflow('qualityControlWorkflow', {
      purchaseOrderId,
      receivedItems,
    });

    return sendSuccess(res, result, 'Quality control verification completed');
  })
);

// ── Blockchain Logs ──────────────────────────────────────────────────────────

// GET /api/agents/blockchain/logs — Get blockchain audit trail
router.get(
  '/blockchain/logs',
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
