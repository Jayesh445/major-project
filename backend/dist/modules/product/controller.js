"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const service_1 = require("./service");
const ApiResponse_1 = require("@/utils/ApiResponse");
const asyncHandler_1 = require("@/utils/asyncHandler");
const dto_1 = require("./dto");
/**
 * Product controller class
 * Handles HTTP requests for product endpoints
 */
class ProductController {
    constructor() {
        this.service = new service_1.ProductService();
        /**
         * Create a new product
         * POST /api/v1/products
         * @access Admin, Procurement Officer
         */
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const dto = dto_1.CreateProductSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const product = await this.service.create(dto, userId);
            res.status(201).json(new ApiResponse_1.ApiResponse(201, product, 'Product created successfully'));
        });
        /**
         * Get all products with filtering and pagination
         * GET /api/v1/products
         * @access All authenticated users
         */
        this.findAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const queryInput = { ...req.query };
            if (queryInput.isActive == null ||
                queryInput.isActive === '' ||
                (Array.isArray(queryInput.isActive) && queryInput.isActive.length === 0)) {
                queryInput.isActive = 'true';
            }
            const query = dto_1.QueryProductsSchema.parse(queryInput);
            const result = await this.service.findAll(query);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Products retrieved successfully'));
        });
        /**
         * Search products
         * GET /api/v1/products/search
         * @access All authenticated users
         */
        this.search = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const query = dto_1.SearchProductsSchema.parse(req.query);
            const result = await this.service.search(query);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, 'Search results retrieved successfully'));
        });
        /**
         * Get product by ID
         * GET /api/v1/products/:id
         * @access All authenticated users
         */
        this.findById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.ProductIdSchema.parse(req.params);
            const product = await this.service.findById(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, product, 'Product retrieved successfully'));
        });
        /**
         * Get product by SKU
         * GET /api/v1/products/sku/:sku
         * @access All authenticated users
         */
        this.findBySku = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const sku = Array.isArray(req.params.sku) ? req.params.sku[0] : req.params.sku;
            const product = await this.service.findBySku(sku);
            if (!product) {
                res.status(404).json(new ApiResponse_1.ApiResponse(404, null, `Product with SKU '${sku}' not found`));
                return;
            }
            res.status(200).json(new ApiResponse_1.ApiResponse(200, product, 'Product retrieved successfully'));
        });
        /**
         * Update product
         * PUT /api/v1/products/:id
         * @access Admin, Procurement Officer
         */
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.ProductIdSchema.parse(req.params);
            const dto = dto_1.UpdateProductSchema.parse(req.body);
            const product = await this.service.update(id, dto);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, product, 'Product updated successfully'));
        });
        /**
         * Soft delete product (set isActive to false)
         * DELETE /api/v1/products/:id
         * @access Admin, Procurement Officer
         */
        this.softDelete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = dto_1.ProductIdSchema.parse(req.params);
            const product = await this.service.softDelete(id);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, product, 'Product deactivated successfully'));
        });
        /**
         * Bulk upload products
         * POST /api/v1/products/bulk-upload
         * @access Admin, Procurement Officer
         */
        this.bulkUpload = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const products = dto_1.BulkUploadProductSchema.parse(req.body);
            const userId = req.user?.userId || 'system';
            const result = await this.service.bulkUpload(products, userId);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, result, `Bulk upload completed. Success: ${result.success}, Failed: ${result.failed}`));
        });
        /**
         * Get products by category
         * GET /api/v1/products/category/:category
         * @access All authenticated users
         */
        this.findByCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const category = Array.isArray(req.params.category)
                ? req.params.category[0]
                : req.params.category;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
            const products = await this.service.findByCategory(category, limit);
            res.status(200).json(new ApiResponse_1.ApiResponse(200, products, `Products in category '${category}' retrieved successfully`));
        });
        /**
         * Get product statistics
         * GET /api/v1/products/statistics
         * @access Admin, Procurement Officer
         */
        this.getStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const statistics = await this.service.getStatistics();
            res.status(200).json(new ApiResponse_1.ApiResponse(200, statistics, 'Product statistics retrieved successfully'));
        });
        /**
         * Get low stock products
         * GET /api/v1/products/low-stock
         * @access Admin, Warehouse Manager, Procurement Officer
         */
        this.getLowStockProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const products = await this.service.getLowStockProducts();
            res.status(200).json(new ApiResponse_1.ApiResponse(200, products, 'Low stock products retrieved successfully'));
        });
    }
}
exports.ProductController = ProductController;
