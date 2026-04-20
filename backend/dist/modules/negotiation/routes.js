"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const middlewares_1 = require("@/middlewares");
/**
 * Negotiation routes
 * Base path: /api/negotiations
 */
const router = (0, express_1.Router)();
/**
 * List all negotiation sessions (with optional filters)
 * GET /api/negotiations?status=in_progress&limit=50&skip=0
 */
router.get('/', middlewares_1.authenticate, controller_1.listNegotiations);
/**
 * Create a new negotiation session
 * POST /api/negotiations
 */
router.post('/', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller_1.createNegotiation);
/**
 * Get a specific negotiation session
 * GET /api/negotiations/:id
 */
router.get('/:id', middlewares_1.authenticate, controller_1.getNegotiation);
/**
 * Add a round to a negotiation session
 * POST /api/negotiations/:id/rounds
 */
router.post('/:id/rounds', middlewares_1.authenticate, controller_1.addNegotiationRound);
/**
 * Submit a negotiation offer and get supplier response
 * POST /api/negotiations/:id/offer
 */
router.post('/:id/offer', middlewares_1.authenticate, controller_1.submitNegotiationOffer);
/**
 * Update negotiation status (accept/reject/close)
 * PATCH /api/negotiations/:id
 */
router.patch('/:id', middlewares_1.authenticate, controller_1.updateNegotiation);
/**
 * Finalize negotiation with agreed terms and create PO
 * POST /api/negotiations/:id/finalize
 */
router.post('/:id/finalize', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller_1.finalizeNegotiation);
/**
 * Delete a negotiation session
 * DELETE /api/negotiations/:id
 */
router.delete('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller_1.deleteNegotiation);
exports.default = router;
