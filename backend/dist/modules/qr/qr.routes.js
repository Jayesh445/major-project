"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("@/middlewares");
const utils_1 = require("@/utils");
const qr_service_1 = require("./qr.service");
const router = (0, express_1.Router)();
// GET /api/qr/po/:poId — returns { qrDataUrl, verifyUrl } JSON
router.get('/po/:poId', middlewares_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { poId } = req.params;
    const eventType = req.query.type || 'po_created';
    const result = await (0, qr_service_1.generateForPurchaseOrder)(poId, eventType);
    return (0, utils_1.sendSuccess)(res, result);
}));
// GET /api/qr/po/:poId/image — returns raw PNG (for printing on labels)
router.get('/po/:poId/image', middlewares_1.authenticate, (0, utils_1.asyncHandler)(async (req, res) => {
    const { poId } = req.params;
    const eventType = req.query.type || 'po_created';
    const buffer = await (0, qr_service_1.generatePngBuffer)(poId, eventType);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="po-${poId}.png"`);
    res.send(buffer);
}));
exports.default = router;
