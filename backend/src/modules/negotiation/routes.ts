import { Router } from 'express';
import {
  createNegotiation,
  getNegotiation,
  addNegotiationRound,
  updateNegotiation,
  submitNegotiationOffer,
  finalizeNegotiation,
  listNegotiations,
  deleteNegotiation,
} from './controller';
import { authenticate, authorize } from '@/middlewares';

/**
 * Negotiation routes
 * Base path: /api/negotiations
 */
const router = Router();

/**
 * List all negotiation sessions (with optional filters)
 * GET /api/negotiations?status=in_progress&limit=50&skip=0
 */
router.get(
  '/',
  authenticate,
  listNegotiations
);

/**
 * Create a new negotiation session
 * POST /api/negotiations
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'procurement_officer'),
  createNegotiation
);

/**
 * Get a specific negotiation session
 * GET /api/negotiations/:id
 */
router.get(
  '/:id',
  authenticate,
  getNegotiation
);

/**
 * Add a round to a negotiation session
 * POST /api/negotiations/:id/rounds
 */
router.post(
  '/:id/rounds',
  authenticate,
  addNegotiationRound
);

/**
 * Submit a negotiation offer and get supplier response
 * POST /api/negotiations/:id/offer
 */
router.post(
  '/:id/offer',
  authenticate,
  submitNegotiationOffer
);

/**
 * Update negotiation status (accept/reject/close)
 * PATCH /api/negotiations/:id
 */
router.patch(
  '/:id',
  authenticate,
  updateNegotiation
);

/**
 * Finalize negotiation with agreed terms and create PO
 * POST /api/negotiations/:id/finalize
 */
router.post(
  '/:id/finalize',
  authenticate,
  authorize('admin', 'procurement_officer'),
  finalizeNegotiation
);

/**
 * Delete a negotiation session
 * DELETE /api/negotiations/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'procurement_officer'),
  deleteNegotiation
);

export default router;
