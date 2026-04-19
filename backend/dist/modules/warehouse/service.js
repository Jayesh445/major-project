"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseService = void 0;
const model_1 = __importDefault(require("./model"));
const ApiError_1 = require("@/utils/ApiError");
/**
 * Warehouse service class
 * Handles all business logic for warehouse operations
 */
class WarehouseService {
    /**
     * Create a new warehouse
     */
    async create(dto) {
        // Check if warehouse code already exists
        const existingWarehouse = await model_1.default.findOne({ code: dto.code });
        if (existingWarehouse) {
            throw new ApiError_1.ApiError(409, `Warehouse with code '${dto.code}' already exists`);
        }
        // Validate manager if provided
        if (dto.manager) {
            await this.validateManager(dto.manager);
        }
        // Validate usedCapacity <= totalCapacity
        if (dto.usedCapacity && dto.usedCapacity > dto.totalCapacity) {
            throw new ApiError_1.ApiError(400, 'Used capacity cannot exceed total capacity');
        }
        // Validate zones
        if (dto.zones && dto.zones.length > 0) {
            this.validateZones(dto.zones);
        }
        const warehouse = new model_1.default(dto);
        await warehouse.save();
        return warehouse;
    }
    /**
     * Get all warehouses with filtering and pagination
     */
    async findAll(query) {
        const { page, limit, city, state, isActive, manager, sortBy, sortOrder } = query;
        // Build filter query
        const filter = {};
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
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Execute query with pagination
        const [warehouses, total] = await Promise.all([
            model_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('manager', 'name email')
                .lean(),
            model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: warehouses,
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
    async findById(id) {
        const warehouse = await model_1.default.findById(id).populate('manager', 'name email role');
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, 'Warehouse not found');
        }
        return warehouse;
    }
    /**
     * Find warehouse by code
     */
    async findByCode(code) {
        return model_1.default.findOne({ code: code.toUpperCase() }).populate('manager', 'name email');
    }
    /**
     * Update warehouse
     */
    async update(id, dto) {
        const warehouse = await model_1.default.findById(id);
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, 'Warehouse not found');
        }
        // If code is being updated, check uniqueness
        if (dto.code && dto.code !== warehouse.code) {
            const existingWarehouse = await model_1.default.findOne({ code: dto.code });
            if (existingWarehouse) {
                throw new ApiError_1.ApiError(409, `Warehouse with code '${dto.code}' already exists`);
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
            throw new ApiError_1.ApiError(400, 'Used capacity cannot exceed total capacity');
        }
        // Update warehouse
        Object.assign(warehouse, dto);
        await warehouse.save();
        return warehouse;
    }
    /**
     * Delete warehouse
     */
    async delete(id) {
        const warehouse = await model_1.default.findById(id);
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, 'Warehouse not found');
        }
        // TODO: Check if warehouse has inventory before deletion
        // Prevent deletion if warehouse is in use
        await warehouse.deleteOne();
    }
    /**
     * Add zone to warehouse
     */
    async addZone(warehouseId, zoneDto) {
        const warehouse = await model_1.default.findById(warehouseId);
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, 'Warehouse not found');
        }
        // Check if zone code already exists in this warehouse
        const existingZone = warehouse.zones.find((zone) => zone.zoneCode === zoneDto.zoneCode.toUpperCase());
        if (existingZone) {
            throw new ApiError_1.ApiError(409, `Zone with code '${zoneDto.zoneCode}' already exists in this warehouse`);
        }
        // Validate zone currentLoad <= capacityUnits
        if (zoneDto.currentLoad > zoneDto.capacityUnits) {
            throw new ApiError_1.ApiError(400, 'Zone current load cannot exceed capacity units');
        }
        // Add zone
        warehouse.zones.push(zoneDto);
        await warehouse.save();
        return warehouse;
    }
    /**
     * Update zone in warehouse
     */
    async updateZone(warehouseId, zoneId, zoneDto) {
        const warehouse = await model_1.default.findById(warehouseId);
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, 'Warehouse not found');
        }
        const zone = warehouse.zones.id(zoneId);
        if (!zone) {
            throw new ApiError_1.ApiError(404, 'Zone not found');
        }
        // If zone code is being updated, check uniqueness
        if (zoneDto.zoneCode && zoneDto.zoneCode !== zone.zoneCode) {
            const existingZone = warehouse.zones.find((z) => z.zoneCode === zoneDto.zoneCode.toUpperCase() && z._id.toString() !== zoneId);
            if (existingZone) {
                throw new ApiError_1.ApiError(409, `Zone with code '${zoneDto.zoneCode}' already exists in this warehouse`);
            }
        }
        // Validate zone currentLoad <= capacityUnits
        const newCapacity = zoneDto.capacityUnits ?? zone.capacityUnits;
        const newLoad = zoneDto.currentLoad ?? zone.currentLoad;
        if (newLoad > newCapacity) {
            throw new ApiError_1.ApiError(400, 'Zone current load cannot exceed capacity units');
        }
        // Update zone
        Object.assign(zone, zoneDto);
        await warehouse.save();
        return warehouse;
    }
    /**
     * Remove zone from warehouse
     */
    async removeZone(warehouseId, zoneId) {
        const warehouse = await model_1.default.findById(warehouseId);
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, 'Warehouse not found');
        }
        const zone = warehouse.zones.id(zoneId);
        if (!zone) {
            throw new ApiError_1.ApiError(404, 'Zone not found');
        }
        // TODO: Check if zone has inventory before deletion
        zone.deleteOne();
        await warehouse.save();
        return warehouse;
    }
    /**
     * Get warehouse capacity report
     */
    async getCapacityReport(warehouseId) {
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
    async getInventorySummary(warehouseId) {
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
    async validateManager(managerId) {
        const { default: User } = await Promise.resolve().then(() => __importStar(require('../user/model')));
        const user = await User.findById(managerId);
        if (!user) {
            throw new ApiError_1.ApiError(404, `User with ID '${managerId}' not found`);
        }
        if (user.role !== 'warehouse_manager' && user.role !== 'admin') {
            throw new ApiError_1.ApiError(400, 'Manager must have warehouse_manager or admin role');
        }
    }
    /**
     * Validate zones
     * @private
     */
    validateZones(zones) {
        // Check for duplicate zone codes
        const zoneCodes = zones.map((z) => z.zoneCode.toUpperCase());
        const duplicates = zoneCodes.filter((code, index) => zoneCodes.indexOf(code) !== index);
        if (duplicates.length > 0) {
            throw new ApiError_1.ApiError(400, `Duplicate zone codes found: ${duplicates.join(', ')}`);
        }
        // Validate each zone
        zones.forEach((zone) => {
            if (zone.currentLoad > zone.capacityUnits) {
                throw new ApiError_1.ApiError(400, `Zone '${zone.zoneCode}' current load cannot exceed capacity units`);
            }
        });
    }
    /**
     * Get warehouse statistics
     */
    async getStatistics() {
        const [total, active, aggregation] = await Promise.all([
            model_1.default.countDocuments(),
            model_1.default.countDocuments({ isActive: true }),
            model_1.default.aggregate([
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
exports.WarehouseService = WarehouseService;
