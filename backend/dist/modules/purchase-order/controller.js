"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderController = void 0;
const service_1 = require("./service");
const ApiResponse_1 = require("@/utils/ApiResponse");
const asyncHandler_1 = require("@/utils/asyncHandler");
const dto_1 = require("./dto");
/**
 * Purchase Order controller class
 * Handles HTTP requests for purchase order endpoints
 */
class PurchaseOrderController {
    constructor() {
        this.service = new service_1.PurchaseOrderService();
        /**
         * Create a new purchase order
         * POST /api/v1/purchase-orders
         * @access Procurement Officer, Admin
         */
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const dto = dto_1.CreatePurchaseOrderSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const po = await this.service.create(dto, userId);
            res.status(201).json(new ApiResponse_1.ApiResponse(201, po, 'Purchase order created successfully'));
        });
        /**
         * Get all purchase orders with filtering and pagination
         * GET /api/v1/purchase-orders
         * @access All authenticated users
         */
        this.findAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const query = dto_1.QueryPurchaseOrdersSchema.parse(req.query);
            const result = await this.service.findAll(query);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Purchase orders retrieved successfully'));
        });
        /**
         * Get purchase order by ID
         * GET /api/v1/purchase-orders/:id
         * @access All authenticated users
         */
        this.findById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const po = await this.service.findById(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order retrieved successfully'));
        });
        /**
         * Get purchase order by PO number
         * GET /api/v1/purchase-orders/po/:poNumber
         * @access All authenticated users
         */
        this.findByPONumber = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const poNumber = Array.isArray(req.params.poNumber)
                ? req.params.poNumber[0]
                : req.params.poNumber;
            const po = await this.service.findByPONumber(poNumber);
            if (!po) {
                res.status(404).json(new ApiResponse_1.ApiResponse(404, null, `Purchase order with PO number '${poNumber}' not found`));
                return;
            }
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order retrieved successfully'));
        });
        /**
         * Update purchase order (draft only)
         * PUT /api/v1/purchase-orders/:id
         * @access Procurement Officer, Admin, Creator
         */
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const dto = dto_1.UpdatePurchaseOrderSchema.parse(req.body);
            const po = await this.service.update(id, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order updated successfully'));
        });
        /**
         * Submit for approval
         * PUT /api/v1/purchase-orders/:id/submit-for-approval
         * @access Procurement Officer, Creator
         */
        this.submitForApproval = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const po = await this.service.submitForApproval(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order submitted for approval'));
        });
        /**
         * Approve purchase order
         * PUT /api/v1/purchase-orders/:id/approve
         * @access Admin, Warehouse Manager
         */
        this.approve = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const dto = dto_1.ApprovePurchaseOrderSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const po = await this.service.approve(id, userId, dto.notes);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order approved successfully'));
        });
        /**
         * Reject purchase order
         * PUT /api/v1/purchase-orders/:id/reject
         * @access Admin, Warehouse Manager
         */
        this.reject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const { reason } = req.body;
            if (!reason || reason.trim().length < 10) {
                throw new Error('Rejection reason is required (min 10 characters)');
            }
            const po = await this.service.reject(id, reason);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order rejected'));
        });
        /**
         * Send to supplier
         * PUT /api/v1/purchase-orders/:id/send
         * @access Procurement Officer, Admin
         */
        this.sendToSupplier = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const po = await this.service.sendToSupplier(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order sent to supplier'));
        });
        /**
         * Acknowledge PO (supplier action)
         * PUT /api/v1/purchase-orders/:id/acknowledge
         * @access Supplier
         */
        this.acknowledge = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const po = await this.service.acknowledge(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order acknowledged'));
        });
        /**
         * Receive purchase order
         * PUT /api/v1/purchase-orders/:id/receive
         * @access Warehouse Manager
         */
        this.receive = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const dto = dto_1.ReceivePurchaseOrderSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const po = await this.service.receive(id, dto, userId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order received successfully'));
        });
        /**
         * Cancel purchase order
         * DELETE /api/v1/purchase-orders/:id
         * @access Admin, Creator
         */
        this.cancel = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.PurchaseOrderIdSchema.parse(req.params);
            const dto = dto_1.CancelPurchaseOrderSchema.parse(req.body);
            const po = await this.service.cancel(id, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, po, 'Purchase order cancelled successfully'));
        });
        /**
         * Get pending approvals
         * GET /api/v1/purchase-orders/pending
         * @access Admin, Warehouse Manager
         */
        this.getPendingApprovals = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const pendingPOs = await this.service.getPendingApprovals();
            res.status(200).json(new ApiResponse_1.ApiResponse(200, pendingPOs, 'Pending approvals retrieved successfully'));
        });
        /**
         * Get analytics
         * GET /api/v1/purchase-orders/analytics
         * @access Admin, Procurement Officer
         */
        this.getAnalytics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const filters = {};
            if (req.query.supplier) {
                filters.supplier = req.query.supplier;
            }
            if (req.query.warehouse) {
                filters.warehouse = req.query.warehouse;
            }
            if (req.query.fromDate) {
                filters.fromDate = new Date(req.query.fromDate);
            }
            if (req.query.toDate) {
                filters.toDate = new Date(req.query.toDate);
            }
            const analytics = await this.service.getAnalytics(filters);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, analytics, 'Analytics retrieved successfully'));
        });
    }
}
exports.PurchaseOrderController = PurchaseOrderController;
