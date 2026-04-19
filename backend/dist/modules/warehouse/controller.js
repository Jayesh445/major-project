"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseController = void 0;
const service_1 = require("./service");
const ApiResponse_1 = require("@/utils/ApiResponse");
const asyncHandler_1 = require("@/utils/asyncHandler");
const dto_1 = require("./dto");
/**
 * Warehouse controller class
 * Handles HTTP requests for warehouse endpoints
 */
class WarehouseController {
    constructor() {
        this.service = new service_1.WarehouseService();
        /**
         * Create a new warehouse
         * POST /api/v1/warehouses
         * @access Admin
         */
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const dto = dto_1.CreateWarehouseSchema.parse(req.body);
            const warehouse = await this.service.create(dto);
            res.status(201).json(new ApiResponse_1.ApiResponse(201, warehouse, 'Warehouse created successfully'));
        });
        /**
         * Get all warehouses with filtering and pagination
         * GET /api/v1/warehouses
         * @access All authenticated users
         */
        this.findAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const query = dto_1.QueryWarehousesSchema.parse(req.query);
            const result = await this.service.findAll(query);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Warehouses retrieved successfully'));
        });
        /**
         * Get warehouse by ID
         * GET /api/v1/warehouses/:id
         * @access All authenticated users
         */
        this.findById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.WarehouseIdSchema.parse(req.params);
            const warehouse = await this.service.findById(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, warehouse, 'Warehouse retrieved successfully'));
        });
        /**
         * Get warehouse by code
         * GET /api/v1/warehouses/code/:code
         * @access All authenticated users
         */
        this.findByCode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
            const warehouse = await this.service.findByCode(code);
            if (!warehouse) {
                res.status(404).json(new ApiResponse_1.ApiResponse(404, null, `Warehouse with code '${code}' not found`));
                return;
            }
            res.status(200).json(new ApiResponse_1.ApiResponse(200, warehouse, 'Warehouse retrieved successfully'));
        });
        /**
         * Update warehouse
         * PUT /api/v1/warehouses/:id
         * @access Admin, Warehouse Manager
         */
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.WarehouseIdSchema.parse(req.params);
            const dto = dto_1.UpdateWarehouseSchema.parse(req.body);
            const warehouse = await this.service.update(id, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, warehouse, 'Warehouse updated successfully'));
        });
        /**
         * Delete warehouse
         * DELETE /api/v1/warehouses/:id
         * @access Admin
         */
        this.delete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.WarehouseIdSchema.parse(req.params);
            await this.service.delete(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'Warehouse deleted successfully'));
        });
        /**
         * Add zone to warehouse
         * POST /api/v1/warehouses/:id/zones
         * @access Admin, Warehouse Manager
         */
        this.addZone = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.WarehouseIdSchema.parse(req.params);
            const dto = dto_1.AddZoneSchema.parse(req.body);
            const warehouse = await this.service.addZone(id, dto);
            res.status(201).json(new ApiResponse_1.ApiResponse(201, warehouse, 'Zone added successfully'));
        });
        /**
         * Update zone in warehouse
         * PUT /api/v1/warehouses/:id/zones/:zoneId
         * @access Admin, Warehouse Manager
         */
        this.updateZone = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id, zoneId } = dto_1.ZoneIdSchema.parse(req.params);
            const dto = dto_1.UpdateZoneSchema.parse(req.body);
            const warehouse = await this.service.updateZone(id, zoneId, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, warehouse, 'Zone updated successfully'));
        });
        /**
         * Remove zone from warehouse
         * DELETE /api/v1/warehouses/:id/zones/:zoneId
         * @access Admin, Warehouse Manager
         */
        this.removeZone = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id, zoneId } = dto_1.ZoneIdSchema.parse(req.params);
            const warehouse = await this.service.removeZone(id, zoneId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, warehouse, 'Zone removed successfully'));
        });
        /**
         * Get warehouse capacity report
         * GET /api/v1/warehouses/:id/capacity-report
         * @access All authenticated users
         */
        this.getCapacityReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.WarehouseIdSchema.parse(req.params);
            const report = await this.service.getCapacityReport(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, report, 'Capacity report retrieved successfully'));
        });
        /**
         * Get warehouse inventory summary
         * GET /api/v1/warehouses/:id/inventory-summary
         * @access All authenticated users
         */
        this.getInventorySummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.WarehouseIdSchema.parse(req.params);
            const summary = await this.service.getInventorySummary(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, summary, 'Inventory summary retrieved successfully'));
        });
        /**
         * Get warehouse statistics
         * GET /api/v1/warehouses/statistics
         * @access Admin, Warehouse Manager
         */
        this.getStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const statistics = await this.service.getStatistics();
            res.status(200).json(new ApiResponse_1.ApiResponse(200, statistics, 'Warehouse statistics retrieved successfully'));
        });
    }
}
exports.WarehouseController = WarehouseController;
