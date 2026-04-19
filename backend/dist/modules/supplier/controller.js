"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
const service_1 = require("./service");
const ApiResponse_1 = require("@/utils/ApiResponse");
const asyncHandler_1 = require("@/utils/asyncHandler");
const dto_1 = require("./dto");
/**
 * Supplier controller class
 * Handles HTTP requests for supplier endpoints
 */
class SupplierController {
    constructor() {
        this.service = new service_1.SupplierService();
        /**
         * Create a new supplier
         * POST /api/v1/suppliers
         * @access Admin
         */
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const dto = dto_1.CreateSupplierSchema.parse(req.body);
            const supplier = await this.service.create(dto);
            res.status(201).json(new ApiResponse_1.ApiResponse(201, supplier, 'Supplier registered successfully'));
        });
        /**
         * Get all suppliers with filtering and pagination
         * GET /api/v1/suppliers
         * @access All authenticated users
         */
        this.findAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const query = dto_1.QuerySuppliersSchema.parse(req.query);
            const result = await this.service.findAll(query);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Suppliers retrieved successfully'));
        });
        /**
         * Get supplier by ID
         * GET /api/v1/suppliers/:id
         * @access All authenticated users
         */
        this.findById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            const supplier = await this.service.findById(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, supplier, 'Supplier retrieved successfully'));
        });
        /**
         * Update supplier
         * PUT /api/v1/suppliers/:id
         * @access Admin, Supplier (own profile)
         */
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            const dto = dto_1.UpdateSupplierSchema.parse(req.body);
            const supplier = await this.service.update(id, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, supplier, 'Supplier updated successfully'));
        });
        /**
         * Delete supplier
         * DELETE /api/v1/suppliers/:id
         * @access Admin
         */
        this.delete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            await this.service.delete(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, null, 'Supplier deleted successfully'));
        });
        /**
         * Add product to supplier catalog
         * POST /api/v1/suppliers/:id/catalog
         * @access Admin, Supplier (own catalog)
         */
        this.addCatalogProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            const dto = dto_1.AddCatalogProductSchema.parse(req.body);
            const supplier = await this.service.addCatalogProduct(id, dto);
            res.status(201).json(new ApiResponse_1.ApiResponse(201, supplier, 'Product added to catalog successfully'));
        });
        /**
         * Update catalog product
         * PUT /api/v1/suppliers/:id/catalog/:productId
         * @access Admin, Supplier (own catalog)
         */
        this.updateCatalogProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id, productId } = dto_1.SupplierProductIdSchema.parse(req.params);
            const dto = dto_1.UpdateCatalogProductSchema.parse(req.body);
            const supplier = await this.service.updateCatalogProduct(id, productId, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, supplier, 'Catalog product updated successfully'));
        });
        /**
         * Remove product from catalog
         * DELETE /api/v1/suppliers/:id/catalog/:productId
         * @access Admin, Supplier (own catalog)
         */
        this.removeCatalogProduct = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id, productId } = dto_1.SupplierProductIdSchema.parse(req.params);
            const supplier = await this.service.removeCatalogProduct(id, productId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, supplier, 'Product removed from catalog successfully'));
        });
        /**
         * Update supplier contract terms
         * PUT /api/v1/suppliers/:id/contract
         * @access Admin, Procurement Officer
         */
        this.updateContractTerms = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            const dto = dto_1.UpdateContractTermsSchema.parse(req.body);
            const supplier = await this.service.updateContractTerms(id, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, supplier, 'Contract terms updated successfully'));
        });
        /**
         * Approve supplier
         * PUT /api/v1/suppliers/:id/approve
         * @access Admin
         */
        this.approveSupplier = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            const supplier = await this.service.approveSupplier(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, supplier, 'Supplier approved successfully'));
        });
        /**
         * Reject/Revoke supplier approval
         * PUT /api/v1/suppliers/:id/reject
         * @access Admin
         */
        this.rejectSupplier = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            const supplier = await this.service.rejectSupplier(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, supplier, 'Supplier approval revoked successfully'));
        });
        /**
         * Get supplier performance metrics
         * GET /api/v1/suppliers/:id/performance
         * @access All authenticated users
         */
        this.getPerformanceMetrics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.SupplierIdSchema.parse(req.params);
            const metrics = await this.service.getPerformanceMetrics(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, metrics, 'Performance metrics retrieved successfully'));
        });
        /**
         * Get supplier statistics
         * GET /api/v1/suppliers/statistics
         * @access Admin, Procurement Officer
         */
        this.getStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const statistics = await this.service.getStatistics();
            res.status(200).json(new ApiResponse_1.ApiResponse(200, statistics, 'Supplier statistics retrieved successfully'));
        });
    }
}
exports.SupplierController = SupplierController;
