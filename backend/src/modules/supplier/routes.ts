import { Router } from 'express';
import { SupplierController } from './controller';
import { authenticate, authorize } from '@/middlewares';

/**
 * Supplier routes
 * Base path: /api/v1/suppliers
 */
const router = Router();
const controller = new SupplierController();

// Note: Uncomment authentication/authorization middleware after implementing user module middleware

/**
 * Special routes (must come before :id routes to avoid conflicts)
 */

// Get supplier statistics
router.get(
  '/statistics',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.getStatistics
);

/**
 * Standard CRUD routes
 */

// Create supplier
router.post(
  '/',
  authenticate,
  authorize('admin'),
  controller.create
);

// Get all suppliers
router.get(
  '/',
  authenticate,
  controller.findAll
);

// Get supplier by ID
router.get(
  '/:id',
  authenticate,
  controller.findById
);

// Update supplier
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'supplier'),
  controller.update
);

// Delete supplier
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  controller.delete
);

/**
 * Catalog management routes
 */

// Add product to catalog
router.post(
  '/:id/catalog',
  authenticate,
  authorize('admin', 'supplier'),
  controller.addCatalogProduct
);

// Update catalog product
router.put(
  '/:id/catalog/:productId',
  authenticate,
  authorize('admin', 'supplier'),
  controller.updateCatalogProduct
);

// Remove product from catalog
router.delete(
  '/:id/catalog/:productId',
  authenticate,
  authorize('admin', 'supplier'),
  controller.removeCatalogProduct
);

/**
 * Contract management routes
 */

// Update contract terms
router.put(
  '/:id/contract',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.updateContractTerms
);

/**
 * Approval workflow routes
 */

// Approve supplier
router.put(
  '/:id/approve',
  authenticate,
  authorize('admin'),
  controller.approveSupplier
);

// Reject supplier
router.put(
  '/:id/reject',
  authenticate,
  authorize('admin'),
  controller.rejectSupplier
);

/**
 * Analytics routes
 */

// Get supplier performance metrics
router.get(
  '/:id/performance',
  authenticate,
  controller.getPerformanceMetrics
);

export default router;
