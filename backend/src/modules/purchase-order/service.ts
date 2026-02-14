import PurchaseOrder, { IPurchaseOrder, ILineItem, POStatus } from './model';
import { ApiError } from '@/utils/ApiError';
import type {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  QueryPurchaseOrdersDto,
  CancelPurchaseOrderDto,
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
 * Purchase Order service class
 * Handles all business logic for purchase order operations
 */
export class PurchaseOrderService {
  /**
   * Create a new purchase order
   */
  async create(dto: CreatePurchaseOrderDto, userId: string): Promise<IPurchaseOrder> {
    // Validate supplier, warehouse, and products
    await this.validateSupplier(dto.supplier);
    await this.validateWarehouse(dto.warehouse);

    for (const item of dto.lineItems) {
      await this.validateProduct(item.product);
    }

    // Calculate total amount
    const totalAmount = dto.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Generate PO number
    const poNumber = await this.generatePONumber();

    // Create PO
    const po = new PurchaseOrder({
      poNumber,
      supplier: dto.supplier,
      warehouse: dto.warehouse,
      lineItems: dto.lineItems,
      totalAmount,
      currency: dto.currency,
      status: 'draft',
      triggeredBy: dto.triggeredBy,
      triggeredAt: new Date(),
      negotiationSession: dto.negotiationSession,
      createdBy: userId,
      expectedDeliveryDate: dto.expectedDeliveryDate,
      notes: dto.notes,
    });

    await po.save();

    // TODO: Create notification for procurement team
    // TODO: Log blockchain event (po_created)

    return po.populate('supplier warehouse lineItems.product createdBy');
  }

  /**
   * Get all purchase orders with filtering and pagination
   */
  async findAll(query: QueryPurchaseOrdersDto): Promise<PaginatedResult<IPurchaseOrder>> {
    const {
      page,
      limit,
      supplier,
      warehouse,
      status,
      triggeredBy,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = query;

    // Build filter
    const filter: any = {};

    if (supplier) {
      filter.supplier = supplier;
    }

    if (warehouse) {
      filter.warehouse = warehouse;
    }

    if (status) {
      filter.status = status;
    }

    if (triggeredBy) {
      filter.triggeredBy = triggeredBy;
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [pos, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('supplier', 'companyName contactEmail')
        .populate('warehouse', 'name code')
        .populate('createdBy approvedBy', 'name email')
        .lean(),
      PurchaseOrder.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: pos as IPurchaseOrder[],
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
   * Find purchase order by ID
   */
  async findById(id: string): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id)
      .populate('supplier', 'companyName contactEmail contactPhone address')
      .populate('warehouse', 'name code location')
      .populate('lineItems.product', 'sku name category unitPrice')
      .populate('createdBy approvedBy', 'name email role')
      .populate('negotiationSession');

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    return po;
  }

  /**
   * Find purchase order by PO number
   */
  async findByPONumber(poNumber: string): Promise<IPurchaseOrder | null> {
    return PurchaseOrder.findOne({ poNumber: poNumber.toUpperCase() })
      .populate('supplier warehouse createdBy');
  }

  /**
   * Update purchase order (draft only)
   */
  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id);

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status !== 'draft') {
      throw new ApiError(400, 'Only draft purchase orders can be updated');
    }

    // Update fields
    if (dto.lineItems) {
      // Validate products
      for (const item of dto.lineItems) {
        await this.validateProduct(item.product);
      }

      po.lineItems = dto.lineItems as ILineItem[];

      // Recalculate total amount
      po.totalAmount = dto.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    if (dto.expectedDeliveryDate) {
      po.expectedDeliveryDate = dto.expectedDeliveryDate as any;
    }

    if (dto.notes !== undefined) {
      po.notes = dto.notes;
    }

    await po.save();

    return po.populate('supplier warehouse lineItems.product');
  }

  /**
   * Submit for approval (draft → pending_approval)
   */
  async submitForApproval(id: string): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id);

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status !== 'draft') {
      throw new ApiError(400, 'Only draft purchase orders can be submitted for approval');
    }

    po.status = 'pending_approval';
    await po.save();

    // TODO: Create notification for approvers
    // TODO: Log blockchain event

    return po.populate('supplier warehouse');
  }

  /**
   * Approve purchase order (pending_approval → approved)
   */
  async approve(id: string, userId: string, notes?: string): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id);

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status !== 'pending_approval') {
      throw new ApiError(400, 'Only pending purchase orders can be approved');
    }

    po.status = 'approved';
    po.approvedBy = userId as any;
    po.approvedAt = new Date();

    if (notes) {
      po.notes = po.notes ? `${po.notes}\n\nApproval notes: ${notes}` : `Approval notes: ${notes}`;
    }

    await po.save();

    // TODO: Create notification for supplier
    // TODO: Log blockchain event (po_approved)

    return po.populate('supplier warehouse approvedBy');
  }

  /**
   * Reject purchase order (pending_approval → draft)
   */
  async reject(id: string, reason: string): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id);

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status !== 'pending_approval') {
      throw new ApiError(400, 'Only pending purchase orders can be rejected');
    }

    po.status = 'draft';
    po.notes = po.notes ? `${po.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`;

    await po.save();

    // TODO: Create notification for creator

    return po.populate('supplier warehouse');
  }

  /**
   * Send to supplier (approved → sent_to_supplier)
   */
  async sendToSupplier(id: string): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id);

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status !== 'approved') {
      throw new ApiError(400, 'Only approved purchase orders can be sent to supplier');
    }

    po.status = 'sent_to_supplier';
    await po.save();

    // TODO: Send email to supplier
    // TODO: Create notification
    // TODO: Log blockchain event (po_sent)

    return po.populate('supplier warehouse');
  }

  /**
   * Supplier acknowledges PO (sent_to_supplier → acknowledged)
   */
  async acknowledge(id: string): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id);

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (po.status !== 'sent_to_supplier') {
      throw new ApiError(400, 'Only sent purchase orders can be acknowledged');
    }

    po.status = 'acknowledged';
    await po.save();

    // TODO: Create notification for warehouse and procurement
    // TODO: Log blockchain event

    return po.populate('supplier warehouse');
  }

  /**
   * Receive purchase order items
   */
  async receive(id: string, dto: ReceivePurchaseOrderDto, userId: string): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id).populate('warehouse lineItems.product');

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (!['acknowledged', 'partially_received'].includes(po.status)) {
      throw new ApiError(400, 'Purchase order must be acknowledged before receiving');
    }

    // Update received quantities
    for (const receivedItem of dto.lineItems) {
      const lineItem = po.lineItems.id(receivedItem.lineItemId);

      if (!lineItem) {
        throw new ApiError(404, `Line item ${receivedItem.lineItemId} not found`);
      }

      const newReceivedQty = lineItem.receivedQty + receivedItem.receivedQty;

      if (newReceivedQty > lineItem.orderedQty) {
        throw new ApiError(
          400,
          `Cannot receive more than ordered. Ordered: ${lineItem.orderedQty}, Already received: ${lineItem.receivedQty}, Attempting: ${receivedItem.receivedQty}`
        );
      }

      lineItem.receivedQty = newReceivedQty;

      // Update inventory - increase currentStock
      await this.updateInventoryOnReceive(
        (lineItem as any).product._id,
        (po as any).warehouse._id,
        receivedItem.receivedQty,
        userId,
        po.poNumber
      );
    }

    // Update PO status
    const allFullyReceived = po.lineItems.every(
      (item) => item.receivedQty === item.orderedQty
    );

    if (allFullyReceived) {
      po.status = 'fully_received';
    } else {
      po.status = 'partially_received';
    }

    await po.save();

    // TODO: Create notification
    // TODO: Log blockchain event (po_received)

    return po.populate('supplier warehouse lineItems.product');
  }

  /**
   * Cancel purchase order
   */
  async cancel(id: string, dto: CancelPurchaseOrderDto): Promise<IPurchaseOrder> {
    const po = await PurchaseOrder.findById(id);

    if (!po) {
      throw new ApiError(404, 'Purchase order not found');
    }

    if (['fully_received', 'cancelled'].includes(po.status)) {
      throw new ApiError(400, 'Cannot cancel fully received or already cancelled purchase order');
    }

    po.status = 'cancelled';
    po.notes = po.notes ? `${po.notes}\n\nCancellation reason: ${dto.reason}` : `Cancellation reason: ${dto.reason}`;

    await po.save();

    // TODO: Create notification for supplier
    // TODO: Log blockchain event

    return po.populate('supplier warehouse');
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<IPurchaseOrder[]> {
    return PurchaseOrder.find({ status: 'pending_approval' })
      .sort({ createdAt: -1 })
      .populate('supplier', 'companyName')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name email');
  }

  /**
   * Get PO analytics
   */
  async getAnalytics(filters?: {
    supplier?: string;
    warehouse?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    totalPOs: number;
    totalValue: number;
    byStatus: Record<string, number>;
    bySupplier: Array<{ supplier: string; count: number; value: number }>;
  }> {
    const matchFilter: any = {};

    if (filters?.supplier) {
      matchFilter.supplier = filters.supplier;
    }

    if (filters?.warehouse) {
      matchFilter.warehouse = filters.warehouse;
    }

    if (filters?.fromDate || filters?.toDate) {
      matchFilter.createdAt = {};
      if (filters.fromDate) {
        matchFilter.createdAt.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        matchFilter.createdAt.$lte = filters.toDate;
      }
    }

    const [total, value, byStatus] = await Promise.all([
      PurchaseOrder.countDocuments(matchFilter),
      PurchaseOrder.aggregate([
        { $match: matchFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    return {
      totalPOs: total,
      totalValue: value[0]?.total || 0,
      byStatus: statusCounts,
      bySupplier: [],
    };
  }

  /**
   * Generate unique PO number
   * @private
   */
  private async generatePONumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get count of POs this month
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const count = await PurchaseOrder.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const sequence = (count + 1).toString().padStart(4, '0');

    return `PO-${year}${month}${sequence}`;
  }

  /**
   * Update inventory when receiving items
   * @private
   */
  private async updateInventoryOnReceive(
    productId: string,
    warehouseId: string,
    quantity: number,
    userId: string,
    poNumber: string
  ): Promise<void> {
    const { default: Inventory } = await import('../inventory/model');

    const inventory = await Inventory.findOne({
      product: productId,
      warehouse: warehouseId,
    });

    if (inventory) {
      inventory.currentStock += quantity;
      inventory.availableStock = Math.max(0, inventory.currentStock - inventory.reservedStock);

      inventory.transactions.push({
        type: 'purchase',
        quantity,
        referenceDoc: poNumber,
        referenceModel: 'PurchaseOrder',
        performedBy: userId as any,
        notes: `Received from PO ${poNumber}`,
        timestamp: new Date(),
      } as any);

      await inventory.save();
    }
  }

  /**
   * Validate supplier exists
   * @private
   */
  private async validateSupplier(supplierId: string): Promise<void> {
    const { default: Supplier } = await import('../supplier/model');
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new ApiError(404, `Supplier with ID '${supplierId}' not found`);
    }

    if (!supplier.isApproved) {
      throw new ApiError(400, `Supplier '${supplier.companyName}' is not approved`);
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
      throw new ApiError(400, `Warehouse '${warehouse.name}' is not active`);
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
      throw new ApiError(400, `Product '${product.name}' is not active`);
    }
  }
}
