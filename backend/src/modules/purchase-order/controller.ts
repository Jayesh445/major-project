import { Request, Response } from 'express';
import { PurchaseOrderService } from './service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { AuthRequest } from '@/middlewares';
import {
  CreatePurchaseOrderSchema,
  UpdatePurchaseOrderSchema,
  ReceivePurchaseOrderSchema,
  QueryPurchaseOrdersSchema,
  PurchaseOrderIdSchema,
  ApprovePurchaseOrderSchema,
  CancelPurchaseOrderSchema,
} from './dto';

/**
 * Purchase Order controller class
 * Handles HTTP requests for purchase order endpoints
 */
export class PurchaseOrderController {
  private service = new PurchaseOrderService();

  /**
   * Create a new purchase order
   * POST /api/v1/purchase-orders
   * @access Procurement Officer, Admin
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = CreatePurchaseOrderSchema.parse(req.body);
    const userId = (req as AuthRequest).user?.userId || 'system';

    const po = await this.service.create(dto, userId);

    res.status(201).json(
      new ApiResponse(201, po, 'Purchase order created successfully')
    );
  });

  /**
   * Get all purchase orders with filtering and pagination
   * GET /api/v1/purchase-orders
   * @access All authenticated users
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = QueryPurchaseOrdersSchema.parse(req.query);

    const result = await this.service.findAll(query);

    res.status(200).json(
      new ApiResponse(200, result, 'Purchase orders retrieved successfully')
    );
  });

  /**
   * Get purchase order by ID
   * GET /api/v1/purchase-orders/:id
   * @access All authenticated users
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);

    const po = await this.service.findById(id);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order retrieved successfully')
    );
  });

  /**
   * Get purchase order by PO number
   * GET /api/v1/purchase-orders/po/:poNumber
   * @access All authenticated users
   */
  findByPONumber = asyncHandler(async (req: Request, res: Response) => {
    const poNumber = Array.isArray(req.params.poNumber)
      ? req.params.poNumber[0]
      : req.params.poNumber;

    const po = await this.service.findByPONumber(poNumber);

    if (!po) {
      res.status(404).json(
        new ApiResponse(404, null, `Purchase order with PO number '${poNumber}' not found`)
      );
      return;
    }

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order retrieved successfully')
    );
  });

  /**
   * Update purchase order (draft only)
   * PUT /api/v1/purchase-orders/:id
   * @access Procurement Officer, Admin, Creator
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);
    const dto = UpdatePurchaseOrderSchema.parse(req.body);

    const po = await this.service.update(id, dto);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order updated successfully')
    );
  });

  /**
   * Submit for approval
   * PUT /api/v1/purchase-orders/:id/submit-for-approval
   * @access Procurement Officer, Creator
   */
  submitForApproval = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);

    const po = await this.service.submitForApproval(id);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order submitted for approval')
    );
  });

  /**
   * Approve purchase order
   * PUT /api/v1/purchase-orders/:id/approve
   * @access Admin, Warehouse Manager
   */
  approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);
    const dto = ApprovePurchaseOrderSchema.parse(req.body);
    const userId = (req as AuthRequest).user?.userId || 'system';

    const po = await this.service.approve(id, userId, dto.notes);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order approved successfully')
    );
  });

  /**
   * Reject purchase order
   * PUT /api/v1/purchase-orders/:id/reject
   * @access Admin, Warehouse Manager
   */
  reject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      throw new Error('Rejection reason is required (min 10 characters)');
    }

    const po = await this.service.reject(id, reason);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order rejected')
    );
  });

  /**
   * Send to supplier
   * PUT /api/v1/purchase-orders/:id/send
   * @access Procurement Officer, Admin
   */
  sendToSupplier = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);

    const po = await this.service.sendToSupplier(id);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order sent to supplier')
    );
  });

  /**
   * Acknowledge PO (supplier action)
   * PUT /api/v1/purchase-orders/:id/acknowledge
   * @access Supplier
   */
  acknowledge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);

    const po = await this.service.acknowledge(id);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order acknowledged')
    );
  });

  /**
   * Receive purchase order
   * PUT /api/v1/purchase-orders/:id/receive
   * @access Warehouse Manager
   */
  receive = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);
    const dto = ReceivePurchaseOrderSchema.parse(req.body);
    const userId = (req as AuthRequest).user?.userId || 'system';

    const po = await this.service.receive(id, dto, userId);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order received successfully')
    );
  });

  /**
   * Cancel purchase order
   * DELETE /api/v1/purchase-orders/:id
   * @access Admin, Creator
   */
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const { id } = PurchaseOrderIdSchema.parse(req.params);
    const dto = CancelPurchaseOrderSchema.parse(req.body);

    const po = await this.service.cancel(id, dto);

    res.status(200).json(
      new ApiResponse(200, po, 'Purchase order cancelled successfully')
    );
  });

  /**
   * Get pending approvals
   * GET /api/v1/purchase-orders/pending
   * @access Admin, Warehouse Manager
   */
  getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
    const pendingPOs = await this.service.getPendingApprovals();

    res.status(200).json(
      new ApiResponse(200, pendingPOs, 'Pending approvals retrieved successfully')
    );
  });

  /**
   * Get analytics
   * GET /api/v1/purchase-orders/analytics
   * @access Admin, Procurement Officer
   */
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const filters: any = {};

    if (req.query.supplier) {
      filters.supplier = req.query.supplier as string;
    }

    if (req.query.warehouse) {
      filters.warehouse = req.query.warehouse as string;
    }

    if (req.query.fromDate) {
      filters.fromDate = new Date(req.query.fromDate as string);
    }

    if (req.query.toDate) {
      filters.toDate = new Date(req.query.toDate as string);
    }

    const analytics = await this.service.getAnalytics(filters);

    res.status(200).json(
      new ApiResponse(200, analytics, 'Analytics retrieved successfully')
    );
  });
}
