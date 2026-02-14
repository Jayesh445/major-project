import { Router } from 'express';
import { ProductController } from './controller';

// Import authentication and authorization middleware from user module
// Adjust the import path based on your actual middleware location
// import { authenticate, authorize } from '@/modules/user/middleware';

/**
 * Product routes
 * Base path: /api/v1/products
 */
const router = Router();
const controller = new ProductController();

// Note: Uncomment authentication/authorization middleware after implementing user module middleware
// For now, routes are open for testing

/**
 * Special routes (must come before :id routes to avoid conflicts)
 */

// Search products
router.get(
  '/search',
  // authenticate,
  controller.search
);

// Get product statistics
router.get(
  '/statistics',
  // authenticate,
  // authorize(['admin', 'procurement_officer']),
  controller.getStatistics
);

// Get low stock products
router.get(
  '/low-stock',
  // authenticate,
  // authorize(['admin', 'warehouse_manager', 'procurement_officer']),
  controller.getLowStockProducts
);

// Get products by category
router.get(
  '/category/:category',
  // authenticate,
  controller.findByCategory
);

// Get product by SKU
router.get(
  '/sku/:sku',
  // authenticate,
  controller.findBySku
);

// Bulk upload products
router.post(
  '/bulk-upload',
  // authenticate,
  // authorize(['admin', 'procurement_officer']),
  controller.bulkUpload
);

/**
 * Standard CRUD routes
 */

// Create product
router.post(
  '/',
  // authenticate,
  // authorize(['admin', 'procurement_officer']),
  controller.create
);

// Get all products (with filtering and pagination)
router.get(
  '/',
  // authenticate,
  controller.findAll
);

// Get product by ID
router.get(
  '/:id',
  // authenticate,
  controller.findById
);

// Update product
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin', 'procurement_officer']),
  controller.update
);

// Soft delete product
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin', 'procurement_officer']),
  controller.softDelete
);

export default router;
