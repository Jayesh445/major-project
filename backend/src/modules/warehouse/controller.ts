import { Request, Response } from 'express';
import { WarehouseService } from './service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  AddZoneSchema,
  UpdateZoneSchema,
  QueryWarehousesSchema,
  WarehouseIdSchema,
  ZoneIdSchema,
} from './dto';

/**
 * Warehouse controller class
 * Handles HTTP requests for warehouse endpoints
 */
export class WarehouseController {
  private service = new WarehouseService();

  /**
   * Create a new warehouse
   * POST /api/v1/warehouses
   * @access Admin
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateWarehouseSchema.parse(req.body);

    const warehouse = await this.service.create(dto);

    res.status(201).json(
      new ApiResponse(201, warehouse, 'Warehouse created successfully')
    );
  });

  /**
   * Get all warehouses with filtering and pagination
   * GET /api/v1/warehouses
   * @access All authenticated users
   */
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const query = QueryWarehousesSchema.parse(req.query);

    const result = await this.service.findAll(query);

    res.status(200).json(
      new ApiResponse(200, result, 'Warehouses retrieved successfully')
    );
  });

  /**
   * Get warehouse by ID
   * GET /api/v1/warehouses/:id
   * @access All authenticated users
   */
  findById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = WarehouseIdSchema.parse(req.params);

    const warehouse = await this.service.findById(id);

    res.status(200).json(
      new ApiResponse(200, warehouse, 'Warehouse retrieved successfully')
    );
  });

  /**
   * Get warehouse by code
   * GET /api/v1/warehouses/code/:code
   * @access All authenticated users
   */
  findByCode = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;

    const warehouse = await this.service.findByCode(code);

    if (!warehouse) {
      res.status(404).json(
        new ApiResponse(404, null, `Warehouse with code '${code}' not found`)
      );
      return;
    }

    res.status(200).json(
      new ApiResponse(200, warehouse, 'Warehouse retrieved successfully')
    );
  });

  /**
   * Update warehouse
   * PUT /api/v1/warehouses/:id
   * @access Admin, Warehouse Manager
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = WarehouseIdSchema.parse(req.params);
    const dto = UpdateWarehouseSchema.parse(req.body);

    const warehouse = await this.service.update(id, dto);

    res.status(200).json(
      new ApiResponse(200, warehouse, 'Warehouse updated successfully')
    );
  });

  /**
   * Delete warehouse
   * DELETE /api/v1/warehouses/:id
   * @access Admin
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = WarehouseIdSchema.parse(req.params);

    await this.service.delete(id);

    res.status(200).json(
      new ApiResponse(200, null, 'Warehouse deleted successfully')
    );
  });

  /**
   * Add zone to warehouse
   * POST /api/v1/warehouses/:id/zones
   * @access Admin, Warehouse Manager
   */
  addZone = asyncHandler(async (req: Request, res: Response) => {
    const { id } = WarehouseIdSchema.parse(req.params);
    const dto = AddZoneSchema.parse(req.body);

    const warehouse = await this.service.addZone(id, dto);

    res.status(201).json(
      new ApiResponse(201, warehouse, 'Zone added successfully')
    );
  });

  /**
   * Update zone in warehouse
   * PUT /api/v1/warehouses/:id/zones/:zoneId
   * @access Admin, Warehouse Manager
   */
  updateZone = asyncHandler(async (req: Request, res: Response) => {
    const { id, zoneId } = ZoneIdSchema.parse(req.params);
    const dto = UpdateZoneSchema.parse(req.body);

    const warehouse = await this.service.updateZone(id, zoneId, dto);

    res.status(200).json(
      new ApiResponse(200, warehouse, 'Zone updated successfully')
    );
  });

  /**
   * Remove zone from warehouse
   * DELETE /api/v1/warehouses/:id/zones/:zoneId
   * @access Admin, Warehouse Manager
   */
  removeZone = asyncHandler(async (req: Request, res: Response) => {
    const { id, zoneId } = ZoneIdSchema.parse(req.params);

    const warehouse = await this.service.removeZone(id, zoneId);

    res.status(200).json(
      new ApiResponse(200, warehouse, 'Zone removed successfully')
    );
  });

  /**
   * Get warehouse capacity report
   * GET /api/v1/warehouses/:id/capacity-report
   * @access All authenticated users
   */
  getCapacityReport = asyncHandler(async (req: Request, res: Response) => {
    const { id } = WarehouseIdSchema.parse(req.params);

    const report = await this.service.getCapacityReport(id);

    res.status(200).json(
      new ApiResponse(200, report, 'Capacity report retrieved successfully')
    );
  });

  /**
   * Get warehouse inventory summary
   * GET /api/v1/warehouses/:id/inventory-summary
   * @access All authenticated users
   */
  getInventorySummary = asyncHandler(async (req: Request, res: Response) => {
    const { id } = WarehouseIdSchema.parse(req.params);

    const summary = await this.service.getInventorySummary(id);

    res.status(200).json(
      new ApiResponse(200, summary, 'Inventory summary retrieved successfully')
    );
  });

  /**
   * Get warehouse statistics
   * GET /api/v1/warehouses/statistics
   * @access Admin, Warehouse Manager
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await this.service.getStatistics();

    res.status(200).json(
      new ApiResponse(200, statistics, 'Warehouse statistics retrieved successfully')
    );
  });
}
