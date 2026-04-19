"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const middlewares_1 = require("@/middlewares");
/**
 * Purchase Order routes
 * Base path: /api/v1/purchase-orders
 */
const router = (0, express_1.Router)();
const controller = new controller_1.PurchaseOrderController();
// Note: Uncomment authentication/authorization middleware after implementing user module middleware
/**
 * Special routes (must come before :id routes to avoid conflicts)
 */
// Get pending approvals
router.get('/pending', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.getPendingApprovals);
// Get analytics
router.get('/analytics', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.getAnalytics);
// Get by PO number
router.get('/po/:poNumber', middlewares_1.authenticate, controller.findByPONumber);
/**
 * Standard CRUD routes
 */
// Create purchase order
router.post('/', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.create);
// Get all purchase orders
router.get('/', middlewares_1.authenticate, controller.findAll);
// Get purchase order by ID
router.get('/:id', middlewares_1.authenticate, controller.findById);
// Update purchase order (draft only)
router.put('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.update);
// Cancel purchase order
router.delete('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.cancel);
/**
 * Workflow action routes
 */
// Submit for approval
router.put('/:id/submit-for-approval', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.submitForApproval);
// Approve
router.put('/:id/approve', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.approve);
// Reject
router.put('/:id/reject', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.reject);
// Send to supplier
router.put('/:id/send', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.sendToSupplier);
// Acknowledge (supplier action)
router.put('/:id/acknowledge', middlewares_1.authenticate, (0, middlewares_1.authorize)('supplier'), controller.acknowledge);
// Receive
router.put('/:id/receive', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.receive);
exports.default = router;
