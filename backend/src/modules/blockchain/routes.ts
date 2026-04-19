import { Router } from 'express';
import { authenticate } from '@/middlewares';
import { internalAuth } from '@/middlewares/internalAuth';
import {
  createLog,
  verifyByReference,
  getLogsByReferenceHandler,
  getLatestLogs,
  handleWebhook,
  getBlockchainStatus,
} from './controller';

const router = Router();

// Public verification endpoint (used by QR scan at receiving dock — no auth needed)
router.get('/verify/:referenceId', verifyByReference);

// Alchemy webhook endpoint (public, called by Alchemy service — no auth needed)
// This receives real-time transaction confirmations
router.post('/webhook', handleWebhook);

// Internal endpoint (called by Mastra workflows via internal.routes.ts)
router.post('/log', internalAuth, createLog);

// Authenticated endpoints for dashboards
router.get('/status', authenticate, getBlockchainStatus);
router.get('/logs/:referenceId', authenticate, getLogsByReferenceHandler);
router.get('/logs', authenticate, getLatestLogs);

export default router;
