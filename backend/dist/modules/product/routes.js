"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const middlewares_1 = require("@/middlewares");
/**
 * Product routes
 * Base path: /api/v1/products
 */
const router = (0, express_1.Router)();
const controller = new controller_1.ProductController();
// Note: Uncomment authentication/authorization middleware after implementing user module middleware
// For now, routes are open for testing
/**
 * Special routes (must come before :id routes to avoid conflicts)
 */
// Search products
router.get('/search', middlewares_1.authenticate, controller.search);
// Get product statistics
router.get('/statistics', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.getStatistics);
// Get low stock products
router.get('/low-stock', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'warehouse_manager', 'procurement_officer'), controller.getLowStockProducts);
// Get products by category
router.get('/category/:category', middlewares_1.authenticate, controller.findByCategory);
// Get product by SKU
router.get('/sku/:sku', middlewares_1.authenticate, controller.findBySku);
// Bulk upload products
router.post('/bulk-upload', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.bulkUpload);
/**
 * Standard CRUD routes
 */
// Create product
router.post('/', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.create);
// Get all products (with filtering and pagination)
router.get('/', middlewares_1.authenticate, controller.findAll);
// Get product by ID
router.get('/:id', middlewares_1.authenticate, controller.findById);
// Update product
router.put('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.update);
// Soft delete product
router.delete('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.softDelete);
exports.default = router;
