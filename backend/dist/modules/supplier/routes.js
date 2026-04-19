"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const middlewares_1 = require("@/middlewares");
/**
 * Supplier routes
 * Base path: /api/v1/suppliers
 */
const router = (0, express_1.Router)();
const controller = new controller_1.SupplierController();
// Note: Uncomment authentication/authorization middleware after implementing user module middleware
/**
 * Special routes (must come before :id routes to avoid conflicts)
 */
// Get supplier statistics
router.get('/statistics', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.getStatistics);
/**
 * Standard CRUD routes
 */
// Create supplier
router.post('/', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin'), controller.create);
// Get all suppliers
router.get('/', middlewares_1.authenticate, controller.findAll);
// Get supplier by ID
router.get('/:id', middlewares_1.authenticate, controller.findById);
// Update supplier
router.put('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'supplier'), controller.update);
// Delete supplier
router.delete('/:id', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin'), controller.delete);
/**
 * Catalog management routes
 */
// Add product to catalog
router.post('/:id/catalog', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'supplier'), controller.addCatalogProduct);
// Update catalog product
router.put('/:id/catalog/:productId', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'supplier'), controller.updateCatalogProduct);
// Remove product from catalog
router.delete('/:id/catalog/:productId', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'supplier'), controller.removeCatalogProduct);
/**
 * Contract management routes
 */
// Update contract terms
router.put('/:id/contract', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin', 'procurement_officer'), controller.updateContractTerms);
/**
 * Approval workflow routes
 */
// Approve supplier
router.put('/:id/approve', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin'), controller.approveSupplier);
// Reject supplier
router.put('/:id/reject', middlewares_1.authenticate, (0, middlewares_1.authorize)('admin'), controller.rejectSupplier);
/**
 * Analytics routes
 */
// Get supplier performance metrics
router.get('/:id/performance', middlewares_1.authenticate, controller.getPerformanceMetrics);
exports.default = router;
