import { Router } from 'express';
import { WarehouseController } from './controller';

// Import authentication and authorization middleware from user module
// import { authenticate, authorize } from '@/modules/user/middleware';

/**
 * Warehouse routes
 * Base path: /api/v1/warehouses
 */
const router = Router();
const controller = new WarehouseController();

// Note: Uncomment authentication/authorization middleware after implementing user module middleware

/**
 * Special routes (must come before :id routes to avoid conflicts)
 */

// Get warehouse statistics
router.get(
  '/statistics',
  // authenticate,
  // authorize(['admin', 'warehouse_manager']),
  controller.getStatistics
);

// Get warehouse by code
router.get(
  '/code/:code',
  // authenticate,
  controller.findByCode
);

/**
 * Standard CRUD routes
 */

// Create warehouse
router.post(
  '/',
  // authenticate,
  // authorize(['admin']),
  controller.create
);

// Get all warehouses
router.get(
  '/',
  // authenticate,
  controller.findAll
);

// Get warehouse by ID
router.get(
  '/:id',
  // authenticate,
  controller.findById
);

// Update warehouse
router.put(
  '/:id',
  // authenticate,
  // authorize(['admin', 'warehouse_manager']),
  controller.update
);

// Delete warehouse
router.delete(
  '/:id',
  // authenticate,
  // authorize(['admin']),
  controller.delete
);

/**
 * Zone management routes
 */

// Add zone to warehouse
router.post(
  '/:id/zones',
  // authenticate,
  // authorize(['admin', 'warehouse_manager']),
  controller.addZone
);

// Update zone
router.put(
  '/:id/zones/:zoneId',
  // authenticate,
  // authorize(['admin', 'warehouse_manager']),
  controller.updateZone
);

// Remove zone
router.delete(
  '/:id/zones/:zoneId',
  // authenticate,
  // authorize(['admin', 'warehouse_manager']),
  controller.removeZone
);

/**
 * Analytics routes
 */

// Get capacity report
router.get(
  '/:id/capacity-report',
  // authenticate,
  controller.getCapacityReport
);

// Get inventory summary
router.get(
  '/:id/inventory-summary',
  // authenticate,
  controller.getInventorySummary
);

export default router;
