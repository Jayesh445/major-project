import { Request, Response } from 'express';
import { SupplierService } from './service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  CreateSupplierSchema,
  UpdateSupplierSchema,
  AddCatalogProductSchema,
  UpdateCatalogProductSchema,
  UpdateContractTermsSchema,
  QuerySuppliersSchema,
  SupplierIdSchema,
  SupplierProductIdSchema,
} from './dto';

/**
 * Supplier controller class
 * Handles HTTP requests for supplier endpoints
 */
export class SupplierController {
  private service = new SupplierService();

  /**
   * Create a new supplier
   * POST /api/v1/suppliers
   * @access Admin
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateSupplierSchema.parse(req.body);

    const supplier = await this.service.create(dto);

    res.status(201).json(
      new ApiResponse(201, supplier, 'Supplier registered successfully')
    );
  });

  /**
   * Get all suppliers with filtering and pagination
   * GET /api/v1/suppliers
   * @access All authenticated users
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = QuerySuppliersSchema.parse(req.query);

    const result = await this.service.findAll(query);

    res.status(200).json(
      new ApiResponse(200, result, 'Suppliers retrieved successfully')
    );
  });

  /**
   * Get supplier by ID
   * GET /api/v1/suppliers/:id
   * @access All authenticated users
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);

    const supplier = await this.service.findById(id);

    res.status(200).json(
      new ApiResponse(200, supplier, 'Supplier retrieved successfully')
    );
  });

  /**
   * Update supplier
   * PUT /api/v1/suppliers/:id
   * @access Admin, Supplier (own profile)
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);
    const dto = UpdateSupplierSchema.parse(req.body);

    const supplier = await this.service.update(id, dto);

    res.status(200).json(
      new ApiResponse(200, supplier, 'Supplier updated successfully')
    );
  });

  /**
   * Delete supplier
   * DELETE /api/v1/suppliers/:id
   * @access Admin
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);

    await this.service.delete(id);

    res.status(200).json(
      new ApiResponse(200, null, 'Supplier deleted successfully')
    );
  });

  /**
   * Add product to supplier catalog
   * POST /api/v1/suppliers/:id/catalog
   * @access Admin, Supplier (own catalog)
   */
  addCatalogProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);
    const dto = AddCatalogProductSchema.parse(req.body);

    const supplier = await this.service.addCatalogProduct(id, dto);

    res.status(201).json(
      new ApiResponse(201, supplier, 'Product added to catalog successfully')
    );
  });

  /**
   * Update catalog product
   * PUT /api/v1/suppliers/:id/catalog/:productId
   * @access Admin, Supplier (own catalog)
   */
  updateCatalogProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id, productId } = SupplierProductIdSchema.parse(req.params);
    const dto = UpdateCatalogProductSchema.parse(req.body);

    const supplier = await this.service.updateCatalogProduct(id, productId, dto);

    res.status(200).json(
      new ApiResponse(200, supplier, 'Catalog product updated successfully')
    );
  });

  /**
   * Remove product from catalog
   * DELETE /api/v1/suppliers/:id/catalog/:productId
   * @access Admin, Supplier (own catalog)
   */
  removeCatalogProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id, productId } = SupplierProductIdSchema.parse(req.params);

    const supplier = await this.service.removeCatalogProduct(id, productId);

    res.status(200).json(
      new ApiResponse(200, supplier, 'Product removed from catalog successfully')
    );
  });

  /**
   * Update supplier contract terms
   * PUT /api/v1/suppliers/:id/contract
   * @access Admin, Procurement Officer
   */
  updateContractTerms = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);
    const dto = UpdateContractTermsSchema.parse(req.body);

    const supplier = await this.service.updateContractTerms(id, dto);

    res.status(200).json(
      new ApiResponse(200, supplier, 'Contract terms updated successfully')
    );
  });

  /**
   * Approve supplier
   * PUT /api/v1/suppliers/:id/approve
   * @access Admin
   */
  approveSupplier = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);

    const supplier = await this.service.approveSupplier(id);

    res.status(200).json(
      new ApiResponse(200, supplier, 'Supplier approved successfully')
    );
  });

  /**
   * Reject/Revoke supplier approval
   * PUT /api/v1/suppliers/:id/reject
   * @access Admin
   */
  rejectSupplier = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);

    const supplier = await this.service.rejectSupplier(id);

    res.status(200).json(
      new ApiResponse(200, supplier, 'Supplier approval revoked successfully')
    );
  });

  /**
   * Get supplier performance metrics
   * GET /api/v1/suppliers/:id/performance
   * @access All authenticated users
   */
  getPerformanceMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { id } = SupplierIdSchema.parse(req.params);

    const metrics = await this.service.getPerformanceMetrics(id);

    res.status(200).json(
      new ApiResponse(200, metrics, 'Performance metrics retrieved successfully')
    );
  });

  /**
   * Get supplier statistics
   * GET /api/v1/suppliers/statistics
   * @access Admin, Procurement Officer
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await this.service.getStatistics();

    res.status(200).json(
      new ApiResponse(200, statistics, 'Supplier statistics retrieved successfully')
    );
  });
}
