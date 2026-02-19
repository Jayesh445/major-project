import Inventory, { IInventory, ITransaction, TransactionType } from './model';
import { ApiError } from '@/utils/ApiError';
import type {
  InitializeInventoryDto,
  AdjustStockDto,
  ReserveStockDto,
  ReleaseReservationDto,
  TransferStockDto,
  UpdateReorderSettingsDto,
  QueryInventoryDto,
  TriggerReplenishmentDto,
  StockValuationQueryDto,
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
 * Inventory service class
 * Handles all business logic for inventory operations
 *
 * CRITICAL: Always auto-compute availableStock = currentStock - reservedStock
 */
export class InventoryService {
  /**
   * Initialize inventory for a product in a warehouse
   */
  async initialize(dto: InitializeInventoryDto, userId: string): Promise<IInventory> {
    // Check if inventory already exists for this product-warehouse combination
    const existing = await Inventory.findOne({
      product: dto.product,
      warehouse: dto.warehouse,
    });

    if (existing) {
      throw new ApiError(
        409,
        'Inventory already exists for this product in this warehouse'
      );
    }

    // Validate product and warehouse exist
    await this.validateProduct(dto.product);
    await this.validateWarehouse(dto.warehouse);

    // Auto-compute availableStock
    const availableStock = Math.max(0, dto.currentStock - dto.reservedStock);

    // Create initial transaction
    const initialTransaction: ITransaction = {
      type: 'adjustment' as TransactionType,
      quantity: dto.currentStock,
      performedBy: userId as any,
      notes: 'Initial inventory setup',
      timestamp: new Date(),
    };

    const inventory = new Inventory({
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
  async findAll(query: QueryInventoryDto): Promise<PaginatedResult<IInventory>> {
    const {
      page,
      limit,
      warehouse,
      product,
      lowStock,
      replenishmentTriggered,
      zone,
      sortBy,
      sortOrder,
    } = query;

    // Build filter
    const filter: any = {};

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
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [inventories, total] = await Promise.all([
      Inventory.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('product', 'sku name category unitPrice')
        .populate('warehouse', 'name code location.city')
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: inventories as IInventory[],
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
  async findById(id: string): Promise<IInventory> {
    const inventory = await Inventory.findById(id)
      .populate('product', 'sku name category unitPrice reorderPoint safetyStock')
      .populate('warehouse', 'name code location')
      .populate('transactions.performedBy', 'name email');

    if (!inventory) {
      throw new ApiError(404, 'Inventory not found');
    }

    return inventory;
  }

  /**
   * Find inventory by product and warehouse
   */
  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string
  ): Promise<IInventory | null> {
    return Inventory.findOne({
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
  async adjustStock(
    inventoryId: string,
    dto: AdjustStockDto,
    userId: string
  ): Promise<IInventory> {
    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      throw new ApiError(404, 'Inventory not found');
    }

    const quantityChange = dto.type === 'increase' ? dto.quantity : -dto.quantity;
    const newCurrentStock = inventory.currentStock + quantityChange;

    if (newCurrentStock < 0) {
      throw new ApiError(400, 'Adjustment would result in negative stock');
    }

    // Update currentStock
    inventory.currentStock = newCurrentStock;

    // AUTO-COMPUTE availableStock
    inventory.availableStock = Math.max(0, inventory.currentStock - inventory.reservedStock);

    // Add transaction
    inventory.transactions.push({
      type: 'adjustment' as TransactionType,
      quantity: quantityChange,
      performedBy: userId as any,
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
  async reserveStock(
    inventoryId: string,
    dto: ReserveStockDto,
    userId: string
  ): Promise<IInventory> {
    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      throw new ApiError(404, 'Inventory not found');
    }

    // Check if enough available stock
    if (inventory.availableStock < dto.quantity) {
      throw new ApiError(
        400,
        `Insufficient available stock. Available: ${inventory.availableStock}, Requested: ${dto.quantity}`
      );
    }

    // Increase reserved stock
    inventory.reservedStock += dto.quantity;

    // AUTO-COMPUTE availableStock
    inventory.availableStock = Math.max(0, inventory.currentStock - inventory.reservedStock);

    // Add transaction
    inventory.transactions.push({
      type: 'reservation' as TransactionType,
      quantity: dto.quantity,
      referenceDoc: dto.referenceDoc,
      referenceModel: dto.referenceModel,
      performedBy: userId as any,
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
  async releaseReservation(
    inventoryId: string,
    dto: ReleaseReservationDto,
    userId: string
  ): Promise<IInventory> {
    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      throw new ApiError(404, 'Inventory not found');
    }

    // Check if enough reserved stock
    if (inventory.reservedStock < dto.quantity) {
      throw new ApiError(
        400,
        `Cannot release more than reserved. Reserved: ${inventory.reservedStock}, Requested: ${dto.quantity}`
      );
    }

    // Decrease reserved stock
    inventory.reservedStock -= dto.quantity;

    // AUTO-COMPUTE availableStock
    inventory.availableStock = Math.max(0, inventory.currentStock - inventory.reservedStock);

    // Add transaction
    inventory.transactions.push({
      type: 'release_reservation' as TransactionType,
      quantity: -dto.quantity,
      referenceDoc: dto.referenceDoc,
      performedBy: userId as any,
      notes: dto.notes,
      timestamp: new Date(),
    });

    await inventory.save();

    return inventory.populate('product warehouse');
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(dto: TransferStockDto, userId: string): Promise<{
    fromInventory: IInventory;
    toInventory: IInventory;
  }> {
    // Get source inventory
    const fromInventory = await this.findByProductAndWarehouse(
      dto.product,
      dto.fromWarehouse
    );

    if (!fromInventory) {
      throw new ApiError(404, 'Source inventory not found');
    }

    // Check available stock
    if (fromInventory.availableStock < dto.quantity) {
      throw new ApiError(400, 'Insufficient available stock in source warehouse');
    }

    // Get or create destination inventory
    let toInventory = await this.findByProductAndWarehouse(dto.product, dto.toWarehouse);

    if (!toInventory) {
      // Create destination inventory if it doesn't exist
      const product = await this.getProduct(dto.product);
      toInventory = new Inventory({
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
    fromInventory.availableStock = Math.max(
      0,
      fromInventory.currentStock - fromInventory.reservedStock
    );
    fromInventory.transactions.push({
      type: 'transfer_out' as TransactionType,
      quantity: -dto.quantity,
      referenceDoc: dto.toWarehouse,
      referenceModel: 'Warehouse',
      performedBy: userId as any,
      notes: `Transfer to warehouse: ${dto.reason}`,
      timestamp: new Date(),
    });

    // Update destination inventory
    toInventory.currentStock += dto.quantity;
    toInventory.availableStock = Math.max(
      0,
      toInventory.currentStock - toInventory.reservedStock
    );
    toInventory.transactions.push({
      type: 'transfer_in' as TransactionType,
      quantity: dto.quantity,
      referenceDoc: dto.fromWarehouse,
      referenceModel: 'Warehouse',
      performedBy: userId as any,
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
  async updateReorderSettings(
    inventoryId: string,
    dto: UpdateReorderSettingsDto
  ): Promise<IInventory> {
    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      throw new ApiError(404, 'Inventory not found');
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
  async getLowStockItems(warehouseId?: string): Promise<IInventory[]> {
    const filter: any = {
      $expr: { $lte: ['$currentStock', '$reorderPoint'] },
    };

    if (warehouseId) {
      filter.warehouse = warehouseId;
    }

    return Inventory.find(filter)
      .populate('product', 'sku name category unitPrice primarySupplier')
      .populate('warehouse', 'name code')
      .sort({ currentStock: 1 });
  }

  /**
   * Trigger replenishment for low stock items
   */
  async triggerReplenishment(
    inventoryId: string,
    dto: TriggerReplenishmentDto,
    userId: string
  ): Promise<IInventory> {
    const inventory = await Inventory.findById(inventoryId).populate('product');

    if (!inventory) {
      throw new ApiError(404, 'Inventory not found');
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
  async getStockReport(warehouseId: string): Promise<{
    warehouse: any;
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    categories: Array<{ category: string; count: number; value: number }>;
  }> {
    const { default: Warehouse } = await import('../warehouse/model');
    const warehouse = await Warehouse.findById(warehouseId);

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    const inventories = await Inventory.find({ warehouse: warehouseId })
      .populate('product', 'category unitPrice');

    let totalValue = 0;
    let lowStockItems = 0;
    const categoryMap: Map<string, { count: number; value: number }> = new Map();

    inventories.forEach((inv: any) => {
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
  async getValuation(query: StockValuationQueryDto): Promise<{
    totalValue: number;
    totalUnits: number;
    breakdown: Array<{
      warehouse?: string;
      category?: string;
      value: number;
      units: number;
    }>;
  }> {
    const filter: any = {};

    if (query.warehouse) {
      filter.warehouse = query.warehouse;
    }

    const inventories = await Inventory.find(filter)
      .populate('product', 'category unitPrice')
      .populate('warehouse', 'name code');

    let totalValue = 0;
    let totalUnits = 0;

    inventories.forEach((inv: any) => {
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
  async getTransactionHistory(inventoryId: string, limit: number = 50): Promise<ITransaction[]> {
    const inventory = await Inventory.findById(inventoryId)
      .select('transactions')
      .populate('transactions.performedBy', 'name email');

    if (!inventory) {
      throw new ApiError(404, 'Inventory not found');
    }

    // Return last N transactions
    return inventory.transactions.slice(-limit).reverse();
  }

  /**
   * Check low stock and create alert
   * @private
   */
  private async checkLowStock(inventory: IInventory): Promise<void> {
    if (inventory.currentStock <= inventory.reorderPoint && !inventory.replenishmentTriggered) {
      // TODO: Create notification for warehouse manager and procurement
      console.log(`LOW STOCK ALERT: ${inventory.product} in ${inventory.warehouse}`);
    }
  }

  /**
   * Validate product exists
   * @private
   */
  private async validateProduct(productId: string): Promise<void> {
    const { default: Product } = await import('../product/model');
    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, `Product with ID '${productId}' not found`);
    }

    if (!product.isActive) {
      throw new ApiError(400, 'Cannot create inventory for inactive product');
    }
  }

  /**
   * Validate warehouse exists
   * @private
   */
  private async validateWarehouse(warehouseId: string): Promise<void> {
    const { default: Warehouse } = await import('../warehouse/model');
    const warehouse = await Warehouse.findById(warehouseId);

    if (!warehouse) {
      throw new ApiError(404, `Warehouse with ID '${warehouseId}' not found`);
    }

    if (!warehouse.isActive) {
      throw new ApiError(400, 'Cannot create inventory for inactive warehouse');
    }
  }

  /**
   * Get product
   * @private
   */
  private async getProduct(productId: string): Promise<any> {
    const { default: Product } = await import('../product/model');
    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, `Product with ID '${productId}' not found`);
    }

    return product;
  }
}
