"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const service_1 = require("./service");
const ApiResponse_1 = require("@/utils/ApiResponse");
const asyncHandler_1 = require("@/utils/asyncHandler");
const dto_1 = require("./dto");
/**
 * Inventory controller class
 * Handles HTTP requests for inventory endpoints
 */
class InventoryController {
    constructor() {
        this.service = new service_1.InventoryService();
        /**
         * Initialize inventory for a product in a warehouse
         * POST /api/v1/inventory
         * @access Admin, Warehouse Manager
         */
        this.initialize = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const dto = dto_1.InitializeInventorySchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const inventory = await this.service.initialize(dto, userId);
            res.status(201).json(new ApiResponse_1.ApiResponse(201, inventory, 'Inventory initialized successfully'));
        });
        /**
         * Get all inventory with filtering and pagination
         * GET /api/v1/inventory
         * @access All authenticated users
         */
        this.findAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const query = dto_1.QueryInventorySchema.parse(req.query);
            const result = await this.service.findAll(query);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Inventory retrieved successfully'));
        });
        /**
         * Get inventory by ID
         * GET /api/v1/inventory/:id
         * @access All authenticated users
         */
        this.findById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.InventoryIdSchema.parse(req.params);
            const inventory = await this.service.findById(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, inventory, 'Inventory retrieved successfully'));
        });
        /**
         * Adjust stock manually
         * PUT /api/v1/inventory/:id/adjust
         * @access Warehouse Manager
         */
        this.adjustStock = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.InventoryIdSchema.parse(req.params);
            const dto = dto_1.AdjustStockSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const inventory = await this.service.adjustStock(id, dto, userId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, inventory, 'Stock adjusted successfully'));
        });
        /**
         * Reserve stock
         * POST /api/v1/inventory/:id/reserve
         * @access All authenticated users
         */
        this.reserveStock = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.InventoryIdSchema.parse(req.params);
            const dto = dto_1.ReserveStockSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const inventory = await this.service.reserveStock(id, dto, userId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, inventory, 'Stock reserved successfully'));
        });
        /**
         * Release stock reservation
         * POST /api/v1/inventory/:id/release
         * @access All authenticated users
         */
        this.releaseReservation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.InventoryIdSchema.parse(req.params);
            const dto = dto_1.ReleaseReservationSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const inventory = await this.service.releaseReservation(id, dto, userId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, inventory, 'Reservation released successfully'));
        });
        /**
         * Transfer stock between warehouses
         * POST /api/v1/inventory/transfer
         * @access Warehouse Manager, Admin
         */
        this.transferStock = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const dto = dto_1.TransferStockSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const result = await this.service.transferStock(dto, userId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Stock transferred successfully'));
        });
        /**
         * Update reorder settings
         * PUT /api/v1/inventory/:id/reorder-settings
         * @access Admin, Procurement Officer
         */
        this.updateReorderSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.InventoryIdSchema.parse(req.params);
            const dto = dto_1.UpdateReorderSettingsSchema.parse(req.body);
            const inventory = await this.service.updateReorderSettings(id, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, inventory, 'Reorder settings updated successfully'));
        });
        /**
         * Get low stock items
         * GET /api/v1/inventory/low-stock
         * @access All authenticated users
         */
        this.getLowStockItems = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const warehouseId = req.query.warehouse;
            const items = await this.service.getLowStockItems(warehouseId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, items, 'Low stock items retrieved successfully'));
        });
        /**
         * Trigger replenishment
         * POST /api/v1/inventory/:id/trigger-replenishment
         * @access Admin, Warehouse Manager, Procurement Officer
         */
        this.triggerReplenishment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.InventoryIdSchema.parse(req.params);
            const dto = dto_1.TriggerReplenishmentSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const inventory = await this.service.triggerReplenishment(id, dto, userId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, inventory, 'Replenishment triggered successfully'));
        });
        /**
         * Get stock report for warehouse
         * GET /api/v1/inventory/stock-report
         * @access All authenticated users
         */
        this.getStockReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const warehouseId = req.query.warehouse;
            if (!warehouseId) {
                throw new Error('Warehouse ID is required');
            }
            const report = await this.service.getStockReport(warehouseId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, report, 'Stock report retrieved successfully'));
        });
        /**
         * Get inventory valuation
         * GET /api/v1/inventory/valuation
         * @access Admin, Procurement Officer
         */
        this.getValuation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const query = dto_1.StockValuationQuerySchema.parse(req.query);
            const valuation = await this.service.getValuation(query);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, valuation, 'Inventory valuation retrieved successfully'));
        });
        /**
         * Get transaction history
         * GET /api/v1/inventory/:id/transactions
         * @access All authenticated users
         */
        this.getTransactionHistory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.InventoryIdSchema.parse(req.params);
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const transactions = await this.service.getTransactionHistory(id, limit);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, transactions, 'Transaction history retrieved successfully'));
        });
    }
}
exports.InventoryController = InventoryController;
