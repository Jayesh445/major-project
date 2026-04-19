import mongoose from 'mongoose';
import PurchaseOrder, { IPurchaseOrder, ILineItem, POStatus } from './model';
import { ApiError } from '@/utils/ApiError';
import { logEventOnChain, getLogsByReference } from '@/modules/blockchain/service';
import BlockchainLog from '@/modules/blockchain/model';
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

    const lineItems = dto.lineItems.map((item) => ({
      ...item,
      product: new mongoose.Types.ObjectId(item.product),
    })) as ILineItem[];

    // Calculate total amount
    const totalAmount = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Generate PO number
    const poNumber = await this.generatePONumber();

    // Create PO
    const po = new PurchaseOrder({
      poNumber,
      supplier: dto.supplier,
      warehouse: dto.warehouse,
      lineItems,
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

    // Log blockchain event asynchronously (don't block PO creation)
    try {
      const lineItemsPayload = po.lineItems.map((li: any) => ({
        sku: li.sku,
        orderedQty: li.orderedQty,
        unitPrice: li.unitPrice,
        totalPrice: li.totalPrice,
      }));

      const blockchainResult = await logEventOnChain({
        eventType: 'po_created',
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload: {
          poNumber: po.poNumber,
          supplier: po.supplier.toString(),
          warehouse: po.warehouse.toString(),
          lineItems: lineItemsPayload,
          totalAmount: po.totalAmount,
          currency: po.currency,
          triggeredBy: po.triggeredBy || 'system',
        },
        amount: po.totalAmount,
        triggeredBy: userId,
      });

      // Update PO with blockchain transaction hash and timestamp
      po.blockchainTxHash = blockchainResult.txHash;
      po.blockchainLoggedAt = new Date();
      await po.save();

      console.log(`[Blockchain] po_created logged for PO ${po.poNumber} with txHash ${blockchainResult.txHash}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log po_created for PO ${po.poNumber}:`, err);
      // Don't throw — PO creation already succeeded
    }

    // TODO: Create notification for procurement team

    // Fetch fresh PO from database with all fields populated
    const freshPO = await PurchaseOrder.findById(po._id)
      .populate('supplier', 'companyName contactEmail contactPhone address')
      .populate('warehouse', 'name code location')
      .populate('lineItems.product', 'sku name category unitPrice')
      .populate('createdBy approvedBy', 'name email role')
      .populate('negotiationSession');

    return freshPO as IPurchaseOrder;
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
        .populate('lineItems.product', 'sku name category unitPrice')
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

      const updatedLineItems = dto.lineItems.map((item) => ({
        ...item,
        product: new mongoose.Types.ObjectId(item.product),
      })) as ILineItem[];

      po.set('lineItems', updatedLineItems);

      // Recalculate total amount
      po.totalAmount = updatedLineItems.reduce((sum, item) => sum + item.totalPrice, 0);
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

    // Log blockchain event asynchronously (don't block workflow)
    try {
      const payload = {
        poNumber: po.poNumber,
        supplier: po.supplier?.toString(),
        warehouse: po.warehouse?.toString(),
        lineItems: po.lineItems?.map((li: any) => ({
          sku: li.sku,
          orderedQty: li.orderedQty,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
        })),
        totalAmount: po.totalAmount,
        currency: po.currency,
        status: po.status,
      };

      await logEventOnChain({
        eventType: 'po_submitted_for_approval',
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload,
        amount: po.totalAmount,
        triggeredBy: undefined,
      });

      console.log(`[Blockchain] po_submitted_for_approval logged for PO ${po.poNumber}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log po_submitted_for_approval for PO ${po.poNumber}:`, err);
      // Don't throw — workflow already succeeded
    }

    // TODO: Create notification for approvers

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

    // Log blockchain event asynchronously (don't block workflow)
    try {
      const payload = {
        poNumber: po.poNumber,
        supplier: po.supplier?.toString(),
        warehouse: po.warehouse?.toString(),
        lineItems: po.lineItems?.map((li: any) => ({
          sku: li.sku,
          orderedQty: li.orderedQty,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
        })),
        totalAmount: po.totalAmount,
        currency: po.currency,
        status: po.status,
        approvedBy: userId,
        approvedAt: po.approvedAt,
      };

      await logEventOnChain({
        eventType: 'po_approved',
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload,
        amount: po.totalAmount,
        triggeredBy: userId,
      });

      console.log(`[Blockchain] po_approved logged for PO ${po.poNumber}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log po_approved for PO ${po.poNumber}:`, err);
      // Don't throw — workflow already succeeded
    }

    // TODO: Create notification for supplier

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

    // Log blockchain event asynchronously (don't block workflow)
    try {
      const payload = {
        poNumber: po.poNumber,
        supplier: po.supplier?.toString(),
        warehouse: po.warehouse?.toString(),
        reason,
        status: po.status,
      };

      await logEventOnChain({
        eventType: 'po_cancelled',
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload,
        amount: 0,
        triggeredBy: undefined,
      });

      console.log(`[Blockchain] po_cancelled logged for PO ${po.poNumber}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log po_cancelled for PO ${po.poNumber}:`, err);
      // Don't throw — workflow already succeeded
    }

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

    // Log blockchain event asynchronously (don't block workflow)
    try {
      const payload = {
        poNumber: po.poNumber,
        supplier: po.supplier?.toString(),
        warehouse: po.warehouse?.toString(),
        lineItems: po.lineItems?.map((li: any) => ({
          sku: li.sku,
          orderedQty: li.orderedQty,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
        })),
        totalAmount: po.totalAmount,
        currency: po.currency,
        status: po.status,
      };

      await logEventOnChain({
        eventType: 'po_sent_to_supplier',
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload,
        amount: po.totalAmount,
        triggeredBy: undefined,
      });

      console.log(`[Blockchain] po_sent_to_supplier logged for PO ${po.poNumber}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log po_sent_to_supplier for PO ${po.poNumber}:`, err);
      // Don't throw — workflow already succeeded
    }

    // TODO: Send email to supplier
    // TODO: Create notification

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

    // Log blockchain event asynchronously (don't block workflow)
    try {
      const payload = {
        poNumber: po.poNumber,
        supplier: po.supplier?.toString(),
        warehouse: po.warehouse?.toString(),
        lineItems: po.lineItems?.map((li: any) => ({
          sku: li.sku,
          orderedQty: li.orderedQty,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
        })),
        totalAmount: po.totalAmount,
        currency: po.currency,
        status: po.status,
      };

      await logEventOnChain({
        eventType: 'po_acknowledged',
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload,
        amount: po.totalAmount,
        triggeredBy: undefined,
      });

      console.log(`[Blockchain] po_acknowledged logged for PO ${po.poNumber}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log po_acknowledged for PO ${po.poNumber}:`, err);
      // Don't throw — workflow already succeeded
    }

    // TODO: Create notification for warehouse and procurement

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

    // Log blockchain event asynchronously (don't block workflow)
    try {
      const payload = {
        poNumber: po.poNumber,
        supplier: po.supplier?.toString(),
        warehouse: po.warehouse?.toString(),
        lineItems: po.lineItems?.map((li: any) => ({
          sku: li.sku,
          orderedQty: li.orderedQty,
          receivedQty: li.receivedQty,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
        })),
        totalAmount: po.totalAmount,
        currency: po.currency,
        status: po.status,
        receivedBy: userId,
      };

      const eventType = allFullyReceived ? 'po_received' : 'po_acknowledged';
      
      await logEventOnChain({
        eventType: eventType as any,
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload,
        amount: po.totalAmount,
        triggeredBy: userId,
      });

      console.log(`[Blockchain] ${eventType} logged for PO ${po.poNumber}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log receipt event for PO ${po.poNumber}:`, err);
      // Don't throw — workflow already succeeded
    }

    // TODO: Create notification

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

    // Log blockchain event asynchronously (don't block workflow)
    try {
      const payload = {
        poNumber: po.poNumber,
        supplier: po.supplier?.toString(),
        warehouse: po.warehouse?.toString(),
        reason: dto.reason,
        status: po.status,
      };

      await logEventOnChain({
        eventType: 'po_cancelled',
        referenceModel: 'PurchaseOrder',
        referenceId: po._id.toString(),
        payload,
        amount: 0,
        triggeredBy: undefined,
      });

      console.log(`[Blockchain] po_cancelled logged for PO ${po.poNumber}`);
    } catch (err) {
      console.error(`[Blockchain] Failed to log po_cancelled for PO ${po.poNumber}:`, err);
      // Don't throw — workflow already succeeded
    }

    // TODO: Create notification for supplier

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

  /**
   * Sync blockchain status for a PO
   * Called when blockchain logs are updated to reflect confirmation status
   * @private
   */
  async syncBlockchainStatus(poId: string): Promise<void> {
    try {
      const po = await PurchaseOrder.findById(poId);
      if (!po) return;

      // Find the po_created blockchain log for this PO
      const blockchainLogs = await BlockchainLog.find({
        referenceModel: 'PurchaseOrder',
        referenceId: poId,
        eventType: 'po_created',
      }).sort({ createdAt: -1 });

      if (blockchainLogs.length === 0) return;

      const latestLog = blockchainLogs[0];

      // Update PO with blockchain information
      po.blockchainTxHash = latestLog.txHash;
      po.blockchainLoggedAt = latestLog.confirmedAt || latestLog.createdAt;

      await po.save();

      if (latestLog.confirmationStatus === 'confirmed') {
        console.log(
          `[PurchaseOrder] Updated blockchain status for PO ${po.poNumber}: confirmed on block ${latestLog.blockNumber}`
        );
      }
    } catch (err) {
      console.error(`[PurchaseOrder] Failed to sync blockchain status for ${poId}:`, err);
      // Don't throw — this is a background operation
    }
  }
}
