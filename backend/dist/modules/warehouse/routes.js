"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const middlewares_1 = require("@/middlewares");
/**
 * Warehouse routes
 * Base path: /api/v1/warehouses
 */
const router = (0, express_1.Router)();
const controller = new controller_1.WarehouseController();
// Note: Uncomment authentication/authorization middleware after implementing user module middleware
/**
 * Special routes (must come before :id routes to avoid conflicts)
 */
// Get warehouse statistics
router.get('/statistics', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.getStatistics);
// Get warehouse by code
router.get('/code/:code', middlewares_1.authenticate, controller.findByCode);
/**
 * Standard CRUD routes
 */
// Create warehouse
router.post('/', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin'), controller.create);
// Get all warehouses
router.get('/', middlewares_1.authenticate, controller.findAll);
// Get warehouse by ID
router.get('/:id', middlewares_1.authenticate, controller.findById);
// Update warehouse
router.put('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.update);
// Delete warehouse
router.delete('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin'), controller.delete);
/**
 * Zone management routes
 */
// Add zone to warehouse
router.post('/:id/zones', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.addZone);
// Update zone
router.put('/:id/zones/:zoneId', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.updateZone);
// Remove zone
router.delete('/:id/zones/:zoneId', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager'), controller.removeZone);
/**
 * Analytics routes
 */
// Get capacity report
router.get('/:id/capacity-report', middlewares_1.authenticate, controller.getCapacityReport);
// Get inventory summary
router.get('/:id/inventory-summary', middlewares_1.authenticate, controller.getInventorySummary);
exports.default = router;
