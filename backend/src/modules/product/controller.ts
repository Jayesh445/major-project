import { Request, Response } from 'express';
import { ProductService } from './service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { AuthRequest } from '@/middlewares';
import {
  CreateProductSchema,
  UpdateProductSchema,
  QueryProductsSchema,
  SearchProductsSchema,
  ProductIdSchema,
  BulkUploadProductSchema,
} from './dto';

/**
 * Product controller class
 * Handles HTTP requests for product endpoints
 */
export class ProductController {
  private service = new ProductService();

  /**
   * Create a new product
   * POST /api/v1/products
   * @access Admin, Procurement Officer
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateProductSchema.parse(req.body);
    const userId = (req as AuthRequest).user?.userId || 'system';

    const product = await this.service.create(dto, userId);

    res.status(201).json(
      new ApiResponse(201, product, 'Product created successfully')
    );
  });

  /**
   * Get all products with filtering and pagination
   * GET /api/v1/products
   * @access All authenticated users
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const queryInput = { ...req.query };
    if (
      queryInput.isActive == null ||
      queryInput.isActive === '' ||
      (Array.isArray(queryInput.isActive) && queryInput.isActive.length === 0)
    ) {
      queryInput.isActive = 'true';
    }
    const query = QueryProductsSchema.parse(queryInput);

    const result = await this.service.findAll(query);

    res.status(200).json(
      new ApiResponse(200, result, 'Products retrieved successfully')
    );
  });

  /**
   * Search products
   * GET /api/v1/products/search
   * @access All authenticated users
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const query = SearchProductsSchema.parse(req.query);

    const result = await this.service.search(query);

    res.status(200).json(
      new ApiResponse(200, result, 'Search results retrieved successfully')
    );
  });

  /**
   * Get product by ID
   * GET /api/v1/products/:id
   * @access All authenticated users
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = ProductIdSchema.parse(req.params);

    const product = await this.service.findById(id);

    res.status(200).json(
      new ApiResponse(200, product, 'Product retrieved successfully')
    );
  });

  /**
   * Get product by SKU
   * GET /api/v1/products/sku/:sku
   * @access All authenticated users
   */
  findBySku = asyncHandler(async (req: Request, res: Response) => {
    const sku = Array.isArray(req.params.sku) ? req.params.sku[0] : req.params.sku;

    const product = await this.service.findBySku(sku);

    if (!product) {
      res.status(404).json(
        new ApiResponse(404, null, `Product with SKU '${sku}' not found`)
      );
      return;
    }

    res.status(200).json(
      new ApiResponse(200, product, 'Product retrieved successfully')
    );
  });

  /**
   * Update product
   * PUT /api/v1/products/:id
   * @access Admin, Procurement Officer
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = ProductIdSchema.parse(req.params);
    const dto = UpdateProductSchema.parse(req.body);

    const product = await this.service.update(id, dto);

    res.status(200).json(
      new ApiResponse(200, product, 'Product updated successfully')
    );
  });

  /**
   * Soft delete product (set isActive to false)
   * DELETE /api/v1/products/:id
   * @access Admin, Procurement Officer
   */
  softDelete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = ProductIdSchema.parse(req.params);

    const product = await this.service.softDelete(id);

    res.status(200).json(
      new ApiResponse(200, product, 'Product deactivated successfully')
    );
  });

  /**
   * Bulk upload products
   * POST /api/v1/products/bulk-upload
   * @access Admin, Procurement Officer
   */
  bulkUpload = asyncHandler(async (req: Request, res: Response) => {
    const products = BulkUploadProductSchema.parse(req.body);
    const userId = (req as AuthRequest).user?.userId || 'system';

    const result = await this.service.bulkUpload(products, userId);

    res.status(200).json(
      new ApiResponse(
        200,
        result,
        `Bulk upload completed. Success: ${result.success}, Failed: ${result.failed}`
      )
    );
  });

  /**
   * Get products by category
   * GET /api/v1/products/category/:category
   * @access All authenticated users
   */
  findByCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = Array.isArray(req.params.category)
      ? req.params.category[0]
      : req.params.category;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const products = await this.service.findByCategory(category, limit);

    res.status(200).json(
      new ApiResponse(200, products, `Products in category '${category}' retrieved successfully`)
    );
  });

  /**
   * Get product statistics
   * GET /api/v1/products/statistics
   * @access Admin, Procurement Officer
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await this.service.getStatistics();

    res.status(200).json(
      new ApiResponse(200, statistics, 'Product statistics retrieved successfully')
    );
  });

  /**
   * Get low stock products
   * GET /api/v1/products/low-stock
   * @access Admin, Warehouse Manager, Procurement Officer
   */
  getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
    const products = await this.service.getLowStockProducts();

    res.status(200).json(
      new ApiResponse(200, products, 'Low stock products retrieved successfully')
    );
  });
}
