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
exports.ProductService = void 0;
const model_1 = __importDefault(require("./model"));
const ApiError_1 = require("@/utils/ApiError");
/**
 * Product service class
 * Handles all business logic for product operations
 */
class ProductService {
    /**
     * Create a new product
     */
    async create(dto, userId) {
        // Check if SKU already exists
        const existingProduct = await model_1.default.findOne({ sku: dto.sku });
        if (existingProduct) {
            throw new ApiError_1.ApiError(409, `Product with SKU '${dto.sku}' already exists`);
        }
        // Validate supplier references if provided
        if (dto.primarySupplier) {
            await this.validateSupplier(dto.primarySupplier);
        }
        if (dto.alternateSuppliers && dto.alternateSuppliers.length > 0) {
            for (const supplierId of dto.alternateSuppliers) {
                await this.validateSupplier(supplierId);
            }
        }
        // Create product
        const product = new model_1.default({
            ...dto,
            uploadedBy: userId,
        });
        await product.save();
        return product;
    }
    /**
     * Get all products with filtering and pagination
     */
    async findAll(query) {
        const { page, limit, category, isActive, primarySupplier, minPrice, maxPrice, sortBy, sortOrder } = query;
        // Build filter query
        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (typeof isActive === 'boolean') {
            filter.isActive = isActive;
        }
        if (primarySupplier) {
            filter.primarySupplier = primarySupplier;
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.unitPrice = {};
            if (minPrice !== undefined) {
                filter.unitPrice.$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                filter.unitPrice.$lte = maxPrice;
            }
        }
        // Calculate pagination
        const skip = (page - 1) * limit;
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Execute query with pagination
        const [products, total] = await Promise.all([
            model_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('primarySupplier', 'companyName contactEmail rating')
                .populate('alternateSuppliers', 'companyName contactEmail rating')
                .populate('uploadedBy', 'name email')
                .lean(),
            model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: products,
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
     * Search products by name, SKU, or description
     */
    async search(query) {
        const { query: searchQuery, page, limit, category } = query;
        // Build filter
        const filter = {
            $text: { $search: searchQuery },
        };
        if (category) {
            filter.category = category;
        }
        // Calculate pagination
        const skip = (page - 1) * limit;
        // Execute search
        const [products, total] = await Promise.all([
            model_1.default.find(filter, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .skip(skip)
                .limit(limit)
                .populate('primarySupplier', 'companyName contactEmail rating')
                .populate('uploadedBy', 'name email')
                .lean(),
            model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: products,
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
     * Find product by ID
     */
    async findById(id) {
        const product = await model_1.default.findById(id)
            .populate('primarySupplier', 'companyName contactEmail contactPhone rating')
            .populate('alternateSuppliers', 'companyName contactEmail rating')
            .populate('uploadedBy', 'name email');
        if (!product) {
            throw new ApiError_1.ApiError(404, 'Product not found');
        }
        return product;
    }
    /**
     * Find product by SKU
     */
    async findBySku(sku) {
        return model_1.default.findOne({ sku: sku.toUpperCase() })
            .populate('primarySupplier')
            .populate('uploadedBy', 'name email');
    }
    /**
     * Update product
     */
    async update(id, dto) {
        const product = await model_1.default.findById(id);
        if (!product) {
            throw new ApiError_1.ApiError(404, 'Product not found');
        }
        // If SKU is being updated, check uniqueness
        if (dto.sku && dto.sku !== product.sku) {
            const existingProduct = await model_1.default.findOne({ sku: dto.sku });
            if (existingProduct) {
                throw new ApiError_1.ApiError(409, `Product with SKU '${dto.sku}' already exists`);
            }
        }
        // Validate supplier references if provided
        if (dto.primarySupplier) {
            await this.validateSupplier(dto.primarySupplier);
        }
        if (dto.alternateSuppliers && dto.alternateSuppliers.length > 0) {
            for (const supplierId of dto.alternateSuppliers) {
                await this.validateSupplier(supplierId);
            }
        }
        // Update product
        Object.assign(product, dto);
        await product.save();
        return product;
    }
    /**
     * Soft delete product (set isActive to false)
     */
    async softDelete(id) {
        const product = await model_1.default.findById(id);
        if (!product) {
            throw new ApiError_1.ApiError(404, 'Product not found');
        }
        product.isActive = false;
        await product.save();
        return product;
    }
    /**
     * Hard delete product (permanent deletion)
     */
    async delete(id) {
        const product = await model_1.default.findById(id);
        if (!product) {
            throw new ApiError_1.ApiError(404, 'Product not found');
        }
        // TODO: Check if product is referenced in inventory, POs, etc.
        // Prevent deletion if in use
        await product.deleteOne();
    }
    /**
     * Bulk upload products
     */
    async bulkUpload(products, userId) {
        const results = {
            success: 0,
            failed: 0,
            errors: [],
        };
        for (let i = 0; i < products.length; i++) {
            try {
                await this.create(products[i], userId);
                results.success++;
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    sku: products[i].sku,
                    error: error.message || 'Unknown error',
                });
            }
        }
        return results;
    }
    /**
     * Get products by category
     */
    async findByCategory(category, limit = 10) {
        return model_1.default.find({ category, isActive: true })
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('primarySupplier', 'companyName rating');
    }
    /**
     * Get low stock products (where inventory is below reorder point)
     * This will be used in conjunction with Inventory module
     */
    async getLowStockProducts() {
        // This is a placeholder - actual implementation requires joining with Inventory
        return model_1.default.find({ isActive: true })
            .populate('primarySupplier', 'companyName contactEmail');
    }
    /**
     * Validate supplier exists
     * @private
     */
    async validateSupplier(supplierId) {
        // Import Supplier model dynamically to avoid circular dependency
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
     * Get product statistics
     */
    async getStatistics() {
        const [total, active, byCategory] = await Promise.all([
            model_1.default.countDocuments(),
            model_1.default.countDocuments({ isActive: true }),
            model_1.default.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);
        const categoryCounts = {};
        byCategory.forEach((item) => {
            categoryCounts[item._id] = item.count;
        });
        return {
            total,
            active,
            inactive: total - active,
            byCategory: categoryCounts,
        };
    }
}
exports.ProductService = ProductService;
