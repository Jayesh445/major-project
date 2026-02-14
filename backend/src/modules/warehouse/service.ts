import Warehouse, { IWarehouse, IZone } from './model';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  AddZoneDto,
  UpdateZoneDto,
  QueryWarehousesDto,
} from './dto';

/**
 * Paginated result interface
 */
interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Warehouse service class
 * Handles all business logic for warehouse operations
 */
export class WarehouseService {
  /**
   * Create a new warehouse
   */
  async create(dto: CreateWarehouseDto): Promise<IWarehouse> {
    // Check if warehouse code already exists
    const existingWarehouse = await Warehouse.findOne({ code: dto.code });
    if (existingWarehouse) {
      throw new ApiError(409, `Warehouse with code '${dto.code}' already exists`);
    }

    // Validate manager if provided
    if (dto.manager) {
      await this.validateManager(dto.manager);
    }

    // Validate usedCapacity <= totalCapacity
    if (dto.usedCapacity && dto.usedCapacity > dto.totalCapacity) {
      throw new ApiError(400, 'Used capacity cannot exceed total capacity');
    }

    // Validate zones
    if (dto.zones && dto.zones.length > 0) {
      this.validateZones(dto.zones);
    }

    const warehouse = new Warehouse(dto);
    await warehouse.save();

    return warehouse;
  }

  /**
   * Get all warehouses with filtering and pagination
   */
  async findAll(query: QueryWarehousesDto): Promise<PaginatedResult<IWarehouse>> {
    const { page, limit, city, state, isActive, manager, sortBy, sortOrder } = query;

    // Build filter query
    const filter: any = {};

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    if (state) {
      filter['location.state'] = new RegExp(state, 'i');
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (manager) {
      filter.manager = manager;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [warehouses, total] = await Promise.all([
      Warehouse.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('manager', 'name email')
        .lean(),
      Warehouse.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: warehouses as IWarehouse[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Find warehouse by ID
   */
  async findById(id: string): Promise<IWarehouse> {
    const warehouse = await Warehouse.findById(id).populate('manager', 'name email role');

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    return warehouse;
  }

  /**
   * Find warehouse by code
   */
  async findByCode(code: string): Promise<IWarehouse | null> {
    return Warehouse.findOne({ code: code.toUpperCase() }).populate('manager', 'name email');
  }

  /**
   * Update warehouse
   */
  async update(id: string, dto: UpdateWarehouseDto): Promise<IWarehouse> {
    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    // If code is being updated, check uniqueness
    if (dto.code && dto.code !== warehouse.code) {
      const existingWarehouse = await Warehouse.findOne({ code: dto.code });
      if (existingWarehouse) {
        throw new ApiError(409, `Warehouse with code '${dto.code}' already exists`);
      }
    }

    // Validate manager if provided
    if (dto.manager) {
      await this.validateManager(dto.manager);
    }

    // Validate capacity if being updated
    const newTotalCapacity = dto.totalCapacity ?? warehouse.totalCapacity;
    const newUsedCapacity = dto.usedCapacity ?? warehouse.usedCapacity;

    if (newUsedCapacity > newTotalCapacity) {
      throw new ApiError(400, 'Used capacity cannot exceed total capacity');
    }

    // Update warehouse
    Object.assign(warehouse, dto);
    await warehouse.save();

    return warehouse;
  }

  /**
   * Delete warehouse
   */
  async delete(id: string): Promise<void> {
    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    // TODO: Check if warehouse has inventory before deletion
    // Prevent deletion if warehouse is in use

    await warehouse.deleteOne();
  }

  /**
   * Add zone to warehouse
   */
  async addZone(warehouseId: string, zoneDto: AddZoneDto): Promise<IWarehouse> {
    const warehouse = await Warehouse.findById(warehouseId);

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    // Check if zone code already exists in this warehouse
    const existingZone = warehouse.zones.find(
      (zone) => zone.zoneCode === zoneDto.zoneCode.toUpperCase()
    );

    if (existingZone) {
      throw new ApiError(409, `Zone with code '${zoneDto.zoneCode}' already exists in this warehouse`);
    }

    // Validate zone currentLoad <= capacityUnits
    if (zoneDto.currentLoad > zoneDto.capacityUnits) {
      throw new ApiError(400, 'Zone current load cannot exceed capacity units');
    }

    // Add zone
    warehouse.zones.push(zoneDto as IZone);
    await warehouse.save();

    return warehouse;
  }

  /**
   * Update zone in warehouse
   */
  async updateZone(warehouseId: string, zoneId: string, zoneDto: UpdateZoneDto): Promise<IWarehouse> {
    const warehouse = await Warehouse.findById(warehouseId);

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    const zone = warehouse.zones.id(zoneId);

    if (!zone) {
      throw new ApiError(404, 'Zone not found');
    }

    // If zone code is being updated, check uniqueness
    if (zoneDto.zoneCode && zoneDto.zoneCode !== zone.zoneCode) {
      const existingZone = warehouse.zones.find(
        (z) => z.zoneCode === zoneDto.zoneCode!.toUpperCase() && z._id!.toString() !== zoneId
      );

      if (existingZone) {
        throw new ApiError(409, `Zone with code '${zoneDto.zoneCode}' already exists in this warehouse`);
      }
    }

    // Validate zone currentLoad <= capacityUnits
    const newCapacity = zoneDto.capacityUnits ?? zone.capacityUnits;
    const newLoad = zoneDto.currentLoad ?? zone.currentLoad;

    if (newLoad > newCapacity) {
      throw new ApiError(400, 'Zone current load cannot exceed capacity units');
    }

    // Update zone
    Object.assign(zone, zoneDto);
    await warehouse.save();

    return warehouse;
  }

  /**
   * Remove zone from warehouse
   */
  async removeZone(warehouseId: string, zoneId: string): Promise<IWarehouse> {
    const warehouse = await Warehouse.findById(warehouseId);

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    const zone = warehouse.zones.id(zoneId);

    if (!zone) {
      throw new ApiError(404, 'Zone not found');
    }

    // TODO: Check if zone has inventory before deletion

    zone.deleteOne();
    await warehouse.save();

    return warehouse;
  }

  /**
   * Get warehouse capacity report
   */
  async getCapacityReport(warehouseId: string): Promise<{
    warehouse: {
      id: string;
      name: string;
      code: string;
    };
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    utilizationPercentage: number;
    zones: Array<{
      zoneCode: string;
      type: string;
      capacityUnits: number;
      currentLoad: number;
      availableUnits: number;
      utilizationPercentage: number;
    }>;
  }> {
    const warehouse = await this.findById(warehouseId);

    const availableCapacity = warehouse.totalCapacity - warehouse.usedCapacity;
    const utilizationPercentage = (warehouse.usedCapacity / warehouse.totalCapacity) * 100;

    const zones = warehouse.zones.map((zone) => ({
      zoneCode: zone.zoneCode,
      type: zone.type,
      capacityUnits: zone.capacityUnits,
      currentLoad: zone.currentLoad,
      availableUnits: zone.capacityUnits - zone.currentLoad,
      utilizationPercentage: (zone.currentLoad / zone.capacityUnits) * 100,
    }));

    return {
      warehouse: {
        id: warehouse._id.toString(),
        name: warehouse.name,
        code: warehouse.code,
      },
      totalCapacity: warehouse.totalCapacity,
      usedCapacity: warehouse.usedCapacity,
      availableCapacity,
      utilizationPercentage: parseFloat(utilizationPercentage.toFixed(2)),
      zones,
    };
  }

  /**
   * Get warehouse inventory summary
   * This will be implemented after Inventory module
   */
  async getInventorySummary(warehouseId: string): Promise<any> {
    const warehouse = await this.findById(warehouseId);

    // TODO: Implement inventory aggregation
    return {
      warehouseId: warehouse._id,
      warehouseName: warehouse.name,
      message: 'Inventory summary will be available after Inventory module implementation',
    };
  }

  /**
   * Validate manager exists and has correct role
   * @private
   */
  private async validateManager(managerId: string): Promise<void> {
    const { default: User } = await import('../user/model');
    const user = await User.findById(managerId);

    if (!user) {
      throw new ApiError(404, `User with ID '${managerId}' not found`);
    }

    if (user.role !== 'warehouse_manager' && user.role !== 'admin') {
      throw new ApiError(400, 'Manager must have warehouse_manager or admin role');
    }
  }

  /**
   * Validate zones
   * @private
   */
  private validateZones(zones: AddZoneDto[]): void {
    // Check for duplicate zone codes
    const zoneCodes = zones.map((z) => z.zoneCode.toUpperCase());
    const duplicates = zoneCodes.filter((code, index) => zoneCodes.indexOf(code) !== index);

    if (duplicates.length > 0) {
      throw new ApiError(400, `Duplicate zone codes found: ${duplicates.join(', ')}`);
    }

    // Validate each zone
    zones.forEach((zone) => {
      if (zone.currentLoad > zone.capacityUnits) {
        throw new ApiError(400, `Zone '${zone.zoneCode}' current load cannot exceed capacity units`);
      }
    });
  }

  /**
   * Get warehouse statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalCapacity: number;
    totalUsedCapacity: number;
    averageUtilization: number;
  }> {
    const [total, active, aggregation] = await Promise.all([
      Warehouse.countDocuments(),
      Warehouse.countDocuments({ isActive: true }),
      Warehouse.aggregate([
        {
          $group: {
            _id: null,
            totalCapacity: { $sum: '$totalCapacity' },
            totalUsedCapacity: { $sum: '$usedCapacity' },
          },
        },
      ]),
    ]);

    const stats = aggregation[0] || { totalCapacity: 0, totalUsedCapacity: 0 };
    const averageUtilization = stats.totalCapacity > 0
      ? (stats.totalUsedCapacity / stats.totalCapacity) * 100
      : 0;

    return {
      total,
      active,
      inactive: total - active,
      totalCapacity: stats.totalCapacity,
      totalUsedCapacity: stats.totalUsedCapacity,
      averageUtilization: parseFloat(averageUtilization.toFixed(2)),
    };
  }
}
