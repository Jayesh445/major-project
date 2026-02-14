import { Request, Response } from 'express';
import { InventoryService } from './service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  InitializeInventorySchema,
  AdjustStockSchema,
  ReserveStockSchema,
  ReleaseReservationSchema,
  TransferStockSchema,
  UpdateReorderSettingsSchema,
  QueryInventorySchema,
  InventoryIdSchema,
  TriggerReplenishmentSchema,
  StockValuationQuerySchema,
} from './dto';

/**
 * Inventory controller class
 * Handles HTTP requests for inventory endpoints
 */
export class InventoryController {
  private service = new InventoryService();

  /**
   * Initialize inventory for a product in a warehouse
   * POST /api/v1/inventory
   * @access Admin, Warehouse Manager
   */
  initialize = asyncHandler(async (req: Request, res: Response) => {
    const dto = InitializeInventorySchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const inventory = await this.service.initialize(dto, userId);

    res.status(201).json(
      new ApiResponse(201, inventory, 'Inventory initialized successfully')
    );
  });

  /**
   * Get all inventory with filtering and pagination
   * GET /api/v1/inventory
   * @access All authenticated users
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = QueryInventorySchema.parse(req.query);

    const result = await this.service.findAll(query);

    res.status(200).json(
      new ApiResponse(200, result, 'Inventory retrieved successfully')
    );
  });

  /**
   * Get inventory by ID
   * GET /api/v1/inventory/:id
   * @access All authenticated users
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = InventoryIdSchema.parse(req.params);

    const inventory = await this.service.findById(id);

    res.status(200).json(
      new ApiResponse(200, inventory, 'Inventory retrieved successfully')
    );
  });

  /**
   * Adjust stock manually
   * PUT /api/v1/inventory/:id/adjust
   * @access Warehouse Manager
   */
  adjustStock = asyncHandler(async (req: Request, res: Response) => {
    const { id } = InventoryIdSchema.parse(req.params);
    const dto = AdjustStockSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const inventory = await this.service.adjustStock(id, dto, userId);

    res.status(200).json(
      new ApiResponse(200, inventory, 'Stock adjusted successfully')
    );
  });

  /**
   * Reserve stock
   * POST /api/v1/inventory/:id/reserve
   * @access All authenticated users
   */
  reserveStock = asyncHandler(async (req: Request, res: Response) => {
    const { id } = InventoryIdSchema.parse(req.params);
    const dto = ReserveStockSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const inventory = await this.service.reserveStock(id, dto, userId);

    res.status(200).json(
      new ApiResponse(200, inventory, 'Stock reserved successfully')
    );
  });

  /**
   * Release stock reservation
   * POST /api/v1/inventory/:id/release
   * @access All authenticated users
   */
  releaseReservation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = InventoryIdSchema.parse(req.params);
    const dto = ReleaseReservationSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const inventory = await this.service.releaseReservation(id, dto, userId);

    res.status(200).json(
      new ApiResponse(200, inventory, 'Reservation released successfully')
    );
  });

  /**
   * Transfer stock between warehouses
   * POST /api/v1/inventory/transfer
   * @access Warehouse Manager, Admin
   */
  transferStock = asyncHandler(async (req: Request, res: Response) => {
    const dto = TransferStockSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const result = await this.service.transferStock(dto, userId);

    res.status(200).json(
      new ApiResponse(200, result, 'Stock transferred successfully')
    );
  });

  /**
   * Update reorder settings
   * PUT /api/v1/inventory/:id/reorder-settings
   * @access Admin, Procurement Officer
   */
  updateReorderSettings = asyncHandler(async (req: Request, res: Response) => {
    const { id } = InventoryIdSchema.parse(req.params);
    const dto = UpdateReorderSettingsSchema.parse(req.body);

    const inventory = await this.service.updateReorderSettings(id, dto);

    res.status(200).json(
      new ApiResponse(200, inventory, 'Reorder settings updated successfully')
    );
  });

  /**
   * Get low stock items
   * GET /api/v1/inventory/low-stock
   * @access All authenticated users
   */
  getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
    const warehouseId = req.query.warehouse as string | undefined;

    const items = await this.service.getLowStockItems(warehouseId);

    res.status(200).json(
      new ApiResponse(200, items, 'Low stock items retrieved successfully')
    );
  });

  /**
   * Trigger replenishment
   * POST /api/v1/inventory/:id/trigger-replenishment
   * @access Admin, Warehouse Manager, Procurement Officer
   */
  triggerReplenishment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = InventoryIdSchema.parse(req.params);
    const dto = TriggerReplenishmentSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const inventory = await this.service.triggerReplenishment(id, dto, userId);

    res.status(200).json(
      new ApiResponse(200, inventory, 'Replenishment triggered successfully')
    );
  });

  /**
   * Get stock report for warehouse
   * GET /api/v1/inventory/stock-report
   * @access All authenticated users
   */
  getStockReport = asyncHandler(async (req: Request, res: Response) => {
    const warehouseId = req.query.warehouse as string;

    if (!warehouseId) {
      throw new Error('Warehouse ID is required');
    }

    const report = await this.service.getStockReport(warehouseId);

    res.status(200).json(
      new ApiResponse(200, report, 'Stock report retrieved successfully')
    );
  });

  /**
   * Get inventory valuation
   * GET /api/v1/inventory/valuation
   * @access Admin, Procurement Officer
   */
  getValuation = asyncHandler(async (req: Request, res: Response) => {
    const query = StockValuationQuerySchema.parse(req.query);

    const valuation = await this.service.getValuation(query);

    res.status(200).json(
      new ApiResponse(200, valuation, 'Inventory valuation retrieved successfully')
    );
  });

  /**
   * Get transaction history
   * GET /api/v1/inventory/:id/transactions
   * @access All authenticated users
   */
  getTransactionHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = InventoryIdSchema.parse(req.params);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const transactions = await this.service.getTransactionHistory(id, limit);

    res.status(200).json(
      new ApiResponse(200, transactions, 'Transaction history retrieved successfully')
    );
  });
}
