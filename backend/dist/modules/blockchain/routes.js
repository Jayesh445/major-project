"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("@/middlewares");
const internalAuth_1 = require("@/middlewares/internalAuth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// Public verification endpoint (used by QR scan at receiving dock — no auth needed)
router.get('/verify/:referenceId', controller_1.verifyByReference);
// Alchemy webhook endpoint (public, called by Alchemy service — no auth needed)
// This receives real-time transaction confirmations
router.post('/webhook', controller_1.handleWebhook);
// Internal endpoint (called by Mastra workflows via internal.routes.ts)
router.post('/log', internalAuth_1.internalAuth, controller_1.createLog);
// Authenticated endpoints for dashboards
router.get('/status', middlewares_1.authenticate, controller_1.getBlockchainStatus);
router.get('/logs/:referenceId', middlewares_1.authenticate, controller_1.getLogsByReferenceHandler);
router.get('/logs', middlewares_1.authenticate, controller_1.getLatestLogs);
exports.default = router;
