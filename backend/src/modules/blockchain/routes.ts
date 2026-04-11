import { Router } from 'express';
import { authenticate } from '@/middlewares';
import { internalAuth } from '@/middlewares/internalAuth';
import {
  createLog,
  verifyByReference,
  getLogsByReferenceHandler,
  getLatestLogs,
} from './controller';

const router = Router();

// Public verification endpoint (used by QR scan at receiving dock — no auth needed)
router.get('/verify/:referenceId', verifyByReference);

// Internal endpoint (called by Mastra workflows via internal.routes.ts)
router.post('/log', internalAuth, createLog);

// Authenticated endpoints for dashboards
router.get('/logs/:referenceId', authenticate, getLogsByReferenceHandler);
router.get('/logs', authenticate, getLatestLogs);

export default router;
