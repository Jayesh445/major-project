"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const middlewares_1 = require("@/middlewares");
/**
 * Inventory routes
 * Base path: /api/v1/inventory
 */
const router = (0, express_1.Router)();
const controller = new controller_1.InventoryController();
// Note: Uncomment authentication/authorization middleware after implementing user module middleware
/**
 * Special routes (must come before :id routes to avoid conflicts)
 */
// Get low stock items
router.get('/low-stock', middlewares_1.authenticate, controller.getLowStockItems);
// Transfer stock between warehouses
router.post('/transfer', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.transferStock);
// Get stock report
router.get('/stock-report', middlewares_1.authenticate, controller.getStockReport);
// Get inventory valuation
router.get('/valuation', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.getValuation);
/**
 * Standard CRUD routes
 */
// Initialize inventory
router.post('/', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.initialize);
// Get all inventory
router.get('/', middlewares_1.authenticate, controller.findAll);
// Get inventory by ID
router.get('/:id', middlewares_1.authenticate, controller.findById);
/**
 * Stock operation routes
 */
// Adjust stock
router.put('/:id/adjust', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.adjustStock);
// Reserve stock
router.post('/:id/reserve', middlewares_1.authenticate, controller.reserveStock);
// Release reservation
router.post('/:id/release', middlewares_1.authenticate, controller.releaseReservation);
// Update reorder settings
router.put('/:id/reorder-settings', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.updateReorderSettings);
// Trigger replenishment
router.post('/:id/trigger-replenishment', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager', 'procurement_officer'), controller.triggerReplenishment);
/**
 * Analytics routes
 */
// Get transaction history
router.get('/:id/transactions', middlewares_1.authenticate, controller.getTransactionHistory);
exports.default = router;
