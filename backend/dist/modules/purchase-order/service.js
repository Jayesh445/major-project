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
exports.PurchaseOrderService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const model_1 = __importDefault(require("./model"));
const ApiError_1 = require("@/utils/ApiError");
/**
 * Purchase Order service class
 * Handles all business logic for purchase order operations
 */
class PurchaseOrderService {
    /**
     * Create a new purchase order
     */
    async create(dto, userId) {
        // Validate supplier, warehouse, and products
        await this.validateSupplier(dto.supplier);
        await this.validateWarehouse(dto.warehouse);
        for (const item of dto.lineItems) {
            await this.validateProduct(item.product);
        }
        const lineItems = dto.lineItems.map((item) => ({
            ...item,
            product: new mongoose_1.default.Types.ObjectId(item.product),
        }));
        // Calculate total amount
        const totalAmount = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
        // Generate PO number
        const poNumber = await this.generatePONumber();
        // Create PO
        const po = new model_1.default({
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
        // TODO: Create notification for procurement team
        // TODO: Log blockchain event (po_created)
        return po.populate('supplier warehouse lineItems.product createdBy');
    }
    /**
     * Get all purchase orders with filtering and pagination
     */
    async findAll(query) {
        const { page, limit, supplier, warehouse, status, triggeredBy, fromDate, toDate, sortBy, sortOrder, } = query;
        // Build filter
        const filter = {};
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
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Execute query
        const [pos, total] = await Promise.all([
            model_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('supplier', 'companyName contactEmail')
                .populate('warehouse', 'name code')
                .populate('createdBy approvedBy', 'name email')
                .lean(),
            model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: pos,
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
    async findById(id) {
        const po = await model_1.default.findById(id)
            .populate('supplier', 'companyName contactEmail contactPhone address')
            .populate('warehouse', 'name code location')
            .populate('lineItems.product', 'sku name category unitPrice')
            .populate('createdBy approvedBy', 'name email role')
            .populate('negotiationSession');
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        return po;
    }
    /**
     * Find purchase order by PO number
     */
    async findByPONumber(poNumber) {
        return model_1.default.findOne({ poNumber: poNumber.toUpperCase() })
            .populate('supplier warehouse createdBy');
    }
    /**
     * Update purchase order (draft only)
     */
    async update(id, dto) {
        const po = await model_1.default.findById(id);
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (po.status !== 'draft') {
            throw new ApiError_1.ApiError(400, 'Only draft purchase orders can be updated');
        }
        // Update fields
        if (dto.lineItems) {
            // Validate products
            for (const item of dto.lineItems) {
                await this.validateProduct(item.product);
            }
            const updatedLineItems = dto.lineItems.map((item) => ({
                ...item,
                product: new mongoose_1.default.Types.ObjectId(item.product),
            }));
            po.set('lineItems', updatedLineItems);
            // Recalculate total amount
            po.totalAmount = updatedLineItems.reduce((sum, item) => sum + item.totalPrice, 0);
        }
        if (dto.expectedDeliveryDate) {
            po.expectedDeliveryDate = dto.expectedDeliveryDate;
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
    async submitForApproval(id) {
        const po = await model_1.default.findById(id);
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (po.status !== 'draft') {
            throw new ApiError_1.ApiError(400, 'Only draft purchase orders can be submitted for approval');
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
    async approve(id, userId, notes) {
        const po = await model_1.default.findById(id);
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (po.status !== 'pending_approval') {
            throw new ApiError_1.ApiError(400, 'Only pending purchase orders can be approved');
        }
        po.status = 'approved';
        po.approvedBy = userId;
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
    async reject(id, reason) {
        const po = await model_1.default.findById(id);
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (po.status !== 'pending_approval') {
            throw new ApiError_1.ApiError(400, 'Only pending purchase orders can be rejected');
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
    async sendToSupplier(id) {
        const po = await model_1.default.findById(id);
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (po.status !== 'approved') {
            throw new ApiError_1.ApiError(400, 'Only approved purchase orders can be sent to supplier');
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
    async acknowledge(id) {
        const po = await model_1.default.findById(id);
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (po.status !== 'sent_to_supplier') {
            throw new ApiError_1.ApiError(400, 'Only sent purchase orders can be acknowledged');
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
    async receive(id, dto, userId) {
        const po = await model_1.default.findById(id).populate('warehouse lineItems.product');
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (!['acknowledged', 'partially_received'].includes(po.status)) {
            throw new ApiError_1.ApiError(400, 'Purchase order must be acknowledged before receiving');
        }
        // Update received quantities
        for (const receivedItem of dto.lineItems) {
            const lineItem = po.lineItems.id(receivedItem.lineItemId);
            if (!lineItem) {
                throw new ApiError_1.ApiError(404, `Line item ${receivedItem.lineItemId} not found`);
            }
            const newReceivedQty = lineItem.receivedQty + receivedItem.receivedQty;
            if (newReceivedQty > lineItem.orderedQty) {
                throw new ApiError_1.ApiError(400, `Cannot receive more than ordered. Ordered: ${lineItem.orderedQty}, Already received: ${lineItem.receivedQty}, Attempting: ${receivedItem.receivedQty}`);
            }
            lineItem.receivedQty = newReceivedQty;
            // Update inventory - increase currentStock
            await this.updateInventoryOnReceive(lineItem.product._id, po.warehouse._id, receivedItem.receivedQty, userId, po.poNumber);
        }
        // Update PO status
        const allFullyReceived = po.lineItems.every((item) => item.receivedQty === item.orderedQty);
        if (allFullyReceived) {
            po.status = 'fully_received';
        }
        else {
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
    async cancel(id, dto) {
        const po = await model_1.default.findById(id);
        if (!po) {
            throw new ApiError_1.ApiError(404, 'Purchase order not found');
        }
        if (['fully_received', 'cancelled'].includes(po.status)) {
            throw new ApiError_1.ApiError(400, 'Cannot cancel fully received or already cancelled purchase order');
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
    async getPendingApprovals() {
        return model_1.default.find({ status: 'pending_approval' })
            .sort({ createdAt: -1 })
            .populate('supplier', 'companyName')
            .populate('warehouse', 'name code')
            .populate('createdBy', 'name email');
    }
    /**
     * Get PO analytics
     */
    async getAnalytics(filters) {
        const matchFilter = {};
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
            model_1.default.countDocuments(matchFilter),
            model_1.default.aggregate([
                { $match: matchFilter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            model_1.default.aggregate([
                { $match: matchFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
        ]);
        const statusCounts = {};
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
    async generatePONumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        // Get count of POs this month
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const count = await model_1.default.countDocuments({
            createdAt: { $gte: startOfMonth },
        });
        const sequence = (count + 1).toString().padStart(4, '0');
        return `PO-${year}${month}${sequence}`;
    }
    /**
     * Update inventory when receiving items
     * @private
     */
    async updateInventoryOnReceive(productId, warehouseId, quantity, userId, poNumber) {
        const { default: Inventory } = await Promise.resolve().then(() => __importStar(require('../inventory/model')));
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
                performedBy: userId,
                notes: `Received from PO ${poNumber}`,
                timestamp: new Date(),
            });
            await inventory.save();
        }
    }
    /**
     * Validate supplier exists
     * @private
     */
    async validateSupplier(supplierId) {
        const { default: Supplier } = await Promise.resolve().then(() => __importStar(require('../supplier/model')));
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, `Supplier with ID '${supplierId}' not found`);
        }
        if (!supplier.isApproved) {
            throw new ApiError_1.ApiError(400, `Supplier '${supplier.companyName}' is not approved`);
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
            throw new ApiError_1.ApiError(400, `Warehouse '${warehouse.name}' is not active`);
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
            throw new ApiError_1.ApiError(400, `Product '${product.name}' is not active`);
        }
    }
}
exports.PurchaseOrderService = PurchaseOrderService;
