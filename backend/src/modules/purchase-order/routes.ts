import { Router } from 'express';
import { PurchaseOrderController } from './controller';
import { authenticate, authorize } from '@/middlewares';

/**
 * Purchase Order routes
 * Base path: /api/v1/purchase-orders
 */
const router = Router();
const controller = new PurchaseOrderController();

// Note: Uncomment authentication/authorization middleware after implementing user module middleware

/**
 * Special routes (must come before :id routes to avoid conflicts)
 */

// Get pending approvals
router.get(
  '/pending',
  authenticate,
  authorize('admin', 'warehouse_manager'),
  controller.getPendingApprovals
);

// Get analytics
router.get(
  '/analytics',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.getAnalytics
);

// Get by PO number
router.get(
  '/po/:poNumber',
  authenticate,
  controller.findByPONumber
);

/**
 * Standard CRUD routes
 */

// Create purchase order
router.post(
  '/',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.create
);

// Get all purchase orders
router.get(
  '/',
  authenticate,
  controller.findAll
);

// Get purchase order by ID
router.get(
  '/:id',
  authenticate,
  controller.findById
);

// Update purchase order (draft only)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.update
);

// Cancel purchase order
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.cancel
);

/**
 * Workflow action routes
 */

// Submit for approval
router.put(
  '/:id/submit-for-approval',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.submitForApproval
);

// Approve
router.put(
  '/:id/approve',
  authenticate,
  authorize('admin', 'warehouse_manager'),
  controller.approve
);

// Reject
router.put(
  '/:id/reject',
  authenticate,
  authorize('admin', 'warehouse_manager'),
  controller.reject
);

// Send to supplier
router.put(
  '/:id/send',
  authenticate,
  authorize('admin', 'procurement_officer'),
  controller.sendToSupplier
);

// Acknowledge (supplier action)
router.put(
  '/:id/acknowledge',
  authenticate,
  authorize('supplier'),
  controller.acknowledge
);

// Receive
router.put(
  '/:id/receive',
  authenticate,
  authorize('admin', 'warehouse_manager'),
  controller.receive
);

export default router;
