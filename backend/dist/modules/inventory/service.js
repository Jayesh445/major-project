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
exports.InventoryService = void 0;
const model_1 = __importDefault(require("./model"));
const ApiError_1 = require("@/utils/ApiError");
/**
 * Inventory service class
 * Handles all business logic for inventory operations
 *
 * CRITICAL: Always auto-compute availableStock = currentStock - reservedStock
 */
class InventoryService {
    /**
     * Initialize inventory for a product in a warehouse
     */
    async initialize(dto, userId) {
        // Check if inventory already exists for this product-warehouse combination
        const existing = await model_1.default.findOne({
            product: dto.product,
            warehouse: dto.warehouse,
        });
        if (existing) {
            throw new ApiError_1.ApiError(409, 'Inventory already exists for this product in this warehouse');
        }
        // Validate product and warehouse exist
        await this.validateProduct(dto.product);
        await this.validateWarehouse(dto.warehouse);
        // Auto-compute availableStock
        const availableStock = Math.max(0, dto.currentStock - dto.reservedStock);
        // Create initial transaction
        const initialTransaction = {
            type: 'adjustment',
            quantity: dto.currentStock,
            performedBy: userId,
            notes: 'Initial inventory setup',
            timestamp: new Date(),
        };
        const inventory = new model_1.default({
            ...dto,
            availableStock,
            transactions: [initialTransaction],
        });
        await inventory.save();
        return inventory.populate('product warehouse');
    }
    /**
     * Get all inventory with filtering and pagination
     */
    async findAll(query) {
        const { page, limit, warehouse, product, lowStock, replenishmentTriggered, zone, sortBy, sortOrder, } = query;
        // Build filter
        const filter = {};
        if (warehouse) {
            filter.warehouse = warehouse;
        }
        if (product) {
            filter.product = product;
        }
        if (lowStock) {
            // Find inventory where currentStock <= reorderPoint
            filter.$expr = { $lte: ['$currentStock', '$reorderPoint'] };
        }
        if (replenishmentTriggered !== undefined) {
            filter.replenishmentTriggered = replenishmentTriggered;
        }
        if (zone) {
            filter.zone = new RegExp(zone, 'i');
        }
        // Pagination
        const skip = (page - 1) * limit;
        // Sort
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Execute query
        const [inventories, total] = await Promise.all([
            model_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('product', 'sku name category unitPrice')
                .populate('warehouse', 'name code location.city')
                .lean(),
            model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: inventories,
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
     * Find inventory by ID
     */
    async findById(id) {
        const inventory = await model_1.default.findById(id)
            .populate('product', 'sku name category unitPrice reorderPoint safetyStock')
            .populate('warehouse', 'name code location')
            .populate('transactions.performedBy', 'name email');
        if (!inventory) {
            throw new ApiError_1.ApiError(404, 'Inventory not found');
        }
        return inventory;
    }
    /**
     * Find inventory by product and warehouse
     */
    async findByProductAndWarehouse(productId, warehouseId) {
        return model_1.default.findOne({
            product: productId,
            warehouse: warehouseId,
        })
            .populate('product')
            .populate('warehouse');
    }
    /**
     * Adjust stock (manual increase or decrease)
     * CRITICAL: Auto-computes availableStock
     */
    async adjustStock(inventoryId, dto, userId) {
        const inventory = await model_1.default.findById(inventoryId);
        if (!inventory) {
            throw new ApiError_1.ApiError(404, 'Inventory not found');
        }
        const quantityChange = dto.type === 'increase' ? dto.quantity : -dto.quantity;
        const newCurrentStock = inventory.currentStock + quantityChange;
        if (newCurrentStock < 0) {
            throw new ApiError_1.ApiError(400, 'Adjustment would result in negative stock');
        }
        // Update currentStock
        inventory.currentStock = newCurrentStock;
        // AUTO-COMPUTE availableStock
        inventory.availableStock = Math.max(0, inventory.currentStock - inventory.reservedStock);
        // Add transaction
        inventory.transactions.push({
            type: 'adjustment',
            quantity: quantityChange,
            performedBy: userId,
            notes: dto.reason,
            timestamp: new Date(),
        });
        await inventory.save();
        // Check if low stock alert needed
        await this.checkLowStock(inventory);
        return inventory.populate('product warehouse');
    }
    /**
     * Reserve stock (for orders)
     * CRITICAL: Auto-computes availableStock
     */
    async reserveStock(inventoryId, dto, userId) {
        const inventory = await model_1.default.findById(inventoryId);
        if (!inventory) {
            throw new ApiError_1.ApiError(404, 'Inventory not found');
        }
        // Check if enough available stock
        if (inventory.availableStock < dto.quantity) {
            throw new ApiError_1.ApiError(400, `Insufficient available stock. Available: ${inventory.availableStock}, Requested: ${dto.quantity}`);
        }
        // Increase reserved stock
        inventory.reservedStock += dto.quantity;
        // AUTO-COMPUTE availableStock
        inventory.availableStock = Math.max(0, inventory.currentStock - inventory.reservedStock);
        // Add transaction
        inventory.transactions.push({
            type: 'reservation',
            quantity: dto.quantity,
            referenceDoc: dto.referenceDoc,
            referenceModel: dto.referenceModel,
            performedBy: userId,
            notes: dto.notes,
            timestamp: new Date(),
        });
        await inventory.save();
        return inventory.populate('product warehouse');
    }
    /**
     * Release stock reservation
     * CRITICAL: Auto-computes availableStock
     */
    async releaseReservation(inventoryId, dto, userId) {
        const inventory = await model_1.default.findById(inventoryId);
        if (!inventory) {
            throw new ApiError_1.ApiError(404, 'Inventory not found');
        }
        // Check if enough reserved stock
        if (inventory.reservedStock < dto.quantity) {
            throw new ApiError_1.ApiError(400, `Cannot release more than reserved. Reserved: ${inventory.reservedStock}, Requested: ${dto.quantity}`);
        }
        // Decrease reserved stock
        inventory.reservedStock -= dto.quantity;
        // AUTO-COMPUTE availableStock
        inventory.availableStock = Math.max(0, inventory.currentStock - inventory.reservedStock);
        // Add transaction
        inventory.transactions.push({
            type: 'release_reservation',
            quantity: -dto.quantity,
            referenceDoc: dto.referenceDoc,
            performedBy: userId,
            notes: dto.notes,
            timestamp: new Date(),
        });
        await inventory.save();
        return inventory.populate('product warehouse');
    }
    /**
     * Transfer stock between warehouses
     */
    async transferStock(dto, userId) {
        // Get source inventory
        const fromInventory = await this.findByProductAndWarehouse(dto.product, dto.fromWarehouse);
        if (!fromInventory) {
            throw new ApiError_1.ApiError(404, 'Source inventory not found');
        }
        // Check available stock
        if (fromInventory.availableStock < dto.quantity) {
            throw new ApiError_1.ApiError(400, 'Insufficient available stock in source warehouse');
        }
        // Get or create destination inventory
        let toInventory = await this.findByProductAndWarehouse(dto.product, dto.toWarehouse);
        if (!toInventory) {
            // Create destination inventory if it doesn't exist
            const product = await this.getProduct(dto.product);
            toInventory = new model_1.default({
                product: dto.product,
                warehouse: dto.toWarehouse,
                currentStock: 0,
                reservedStock: 0,
                availableStock: 0,
                reorderPoint: product.reorderPoint,
                safetyStock: product.safetyStock,
                transactions: [],
            });
        }
        // Update source inventory
        fromInventory.currentStock -= dto.quantity;
        fromInventory.availableStock = Math.max(0, fromInventory.currentStock - fromInventory.reservedStock);
        fromInventory.transactions.push({
            type: 'transfer_out',
            quantity: -dto.quantity,
            referenceDoc: dto.toWarehouse,
            referenceModel: 'Warehouse',
            performedBy: userId,
            notes: `Transfer to warehouse: ${dto.reason}`,
            timestamp: new Date(),
        });
        // Update destination inventory
        toInventory.currentStock += dto.quantity;
        toInventory.availableStock = Math.max(0, toInventory.currentStock - toInventory.reservedStock);
        toInventory.transactions.push({
            type: 'transfer_in',
            quantity: dto.quantity,
            referenceDoc: dto.fromWarehouse,
            referenceModel: 'Warehouse',
            performedBy: userId,
            notes: `Transfer from warehouse: ${dto.reason}`,
            timestamp: new Date(),
        });
        await Promise.all([fromInventory.save(), toInventory.save()]);
        return {
            fromInventory: await fromInventory.populate('product warehouse'),
            toInventory: await toInventory.populate('product warehouse'),
        };
    }
    /**
     * Update reorder settings
     */
    async updateReorderSettings(inventoryId, dto) {
        const inventory = await model_1.default.findById(inventoryId);
        if (!inventory) {
            throw new ApiError_1.ApiError(404, 'Inventory not found');
        }
        if (dto.reorderPoint !== undefined) {
            inventory.reorderPoint = dto.reorderPoint;
        }
        if (dto.safetyStock !== undefined) {
            inventory.safetyStock = dto.safetyStock;
        }
        if (dto.zone !== undefined) {
            inventory.zone = dto.zone;
        }
        await inventory.save();
        return inventory.populate('product warehouse');
    }
    /**
     * Get low stock items
     */
    async getLowStockItems(warehouseId) {
        const filter = {
            $expr: { $lte: ['$currentStock', '$reorderPoint'] },
        };
        if (warehouseId) {
            filter.warehouse = warehouseId;
        }
        return model_1.default.find(filter)
            .populate('product', 'sku name category unitPrice primarySupplier')
            .populate('warehouse', 'name code')
            .sort({ currentStock: 1 });
    }
    /**
     * Trigger replenishment for low stock items
     */
    async triggerReplenishment(inventoryId, dto, userId) {
        const inventory = await model_1.default.findById(inventoryId).populate('product');
        if (!inventory) {
            throw new ApiError_1.ApiError(404, 'Inventory not found');
        }
        inventory.replenishmentTriggered = true;
        inventory.lastReplenishmentAt = new Date();
        await inventory.save();
        // TODO: Create notification for procurement team
        // TODO: Auto-create PO if dto.autoCreatePO is true
        return inventory.populate('warehouse');
    }
    /**
     * Get stock report for a warehouse
     */
    async getStockReport(warehouseId) {
        const { default: Warehouse } = await Promise.resolve().then(() => __importStar(require('../warehouse/model')));
        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, 'Warehouse not found');
        }
        const inventories = await model_1.default.find({ warehouse: warehouseId })
            .populate('product', 'category unitPrice');
        let totalValue = 0;
        let lowStockItems = 0;
        const categoryMap = new Map();
        inventories.forEach((inv) => {
            const value = inv.currentStock * (inv.product?.unitPrice || 0);
            totalValue += value;
            if (inv.currentStock <= inv.reorderPoint) {
                lowStockItems++;
            }
            const category = inv.product?.category || 'uncategorized';
            const existing = categoryMap.get(category) || { count: 0, value: 0 };
            categoryMap.set(category, {
                count: existing.count + 1,
                value: existing.value + value,
            });
        });
        const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            count: data.count,
            value: parseFloat(data.value.toFixed(2)),
        }));
        return {
            warehouse: {
                id: warehouse._id,
                name: warehouse.name,
                code: warehouse.code,
            },
            totalItems: inventories.length,
            totalValue: parseFloat(totalValue.toFixed(2)),
            lowStockItems,
            categories,
        };
    }
    /**
     * Get inventory valuation
     */
    async getValuation(query) {
        const filter = {};
        if (query.warehouse) {
            filter.warehouse = query.warehouse;
        }
        const inventories = await model_1.default.find(filter)
            .populate('product', 'category unitPrice')
            .populate('warehouse', 'name code');
        let totalValue = 0;
        let totalUnits = 0;
        inventories.forEach((inv) => {
            const value = inv.currentStock * (inv.product?.unitPrice || 0);
            totalValue += value;
            totalUnits += inv.currentStock;
        });
        // Simple breakdown by warehouse
        const breakdown = [
            {
                value: parseFloat(totalValue.toFixed(2)),
                units: totalUnits,
            },
        ];
        return {
            totalValue: parseFloat(totalValue.toFixed(2)),
            totalUnits,
            breakdown,
        };
    }
    /**
     * Get transaction history for inventory
     */
    async getTransactionHistory(inventoryId, limit = 50) {
        const inventory = await model_1.default.findById(inventoryId)
            .select('transactions')
            .populate('transactions.performedBy', 'name email');
        if (!inventory) {
            throw new ApiError_1.ApiError(404, 'Inventory not found');
        }
        // Return last N transactions
        return inventory.transactions.slice(-limit).reverse();
    }
    /**
     * Check low stock and create alert
     * @private
     */
    async checkLowStock(inventory) {
        if (inventory.currentStock <= inventory.reorderPoint && !inventory.replenishmentTriggered) {
            // TODO: Create notification for warehouse manager and procurement
            console.log(`LOW STOCK ALERT: ${inventory.product} in ${inventory.warehouse}`);
        }
    }
    /**
     * Validate product exists
     * @private
     */
    async validateProduct(productId) {
        const { default: Product } = await Promise.resolve().then(() => __importStar(require('../product/model')));
        const product = await Product.findById(productId);
        if (!product) {
            throw new ApiError_1.ApiError(404, `Product with ID '${productId}' not found`);
        }
        if (!product.isActive) {
            throw new ApiError_1.ApiError(400, 'Cannot create inventory for inactive product');
        }
    }
    /**
     * Validate warehouse exists
     * @private
     */
    async validateWarehouse(warehouseId) {
        const { default: Warehouse } = await Promise.resolve().then(() => __importStar(require('../warehouse/model')));
        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
            throw new ApiError_1.ApiError(404, `Warehouse with ID '${warehouseId}' not found`);
        }
        if (!warehouse.isActive) {
            throw new ApiError_1.ApiError(400, 'Cannot create inventory for inactive warehouse');
        }
    }
    /**
     * Get product
     * @private
     */
    async getProduct(productId) {
        const { default: Product } = await Promise.resolve().then(() => __importStar(require('../product/model')));
        const product = await Product.findById(productId);
        if (!product) {
            throw new ApiError_1.ApiError(404, `Product with ID '${productId}' not found`);
        }
        return product;
    }
}
exports.InventoryService = InventoryService;
