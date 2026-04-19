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
exports.SupplierService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const model_1 = __importDefault(require("./model"));
const ApiError_1 = require("@/utils/ApiError");
/**
 * Supplier service class
 * Handles all business logic for supplier operations
 */
class SupplierService {
    /**
     * Create a new supplier
     */
    async create(dto) {
        // Check if supplier with same email already exists
        const existingSupplier = await model_1.default.findOne({ contactEmail: dto.contactEmail });
        if (existingSupplier) {
            throw new ApiError_1.ApiError(409, `Supplier with email '${dto.contactEmail}' already exists`);
        }
        // Validate catalog products if provided
        if (dto.catalogProducts && dto.catalogProducts.length > 0) {
            await this.validateCatalogProducts(dto.catalogProducts);
        }
        const supplier = new model_1.default(dto);
        await supplier.save();
        return supplier;
    }
    /**
     * Get all suppliers with filtering and pagination
     */
    async findAll(query) {
        const { page, limit, isApproved, minRating, search, sortBy, sortOrder } = query;
        // Build filter query
        const filter = {};
        if (isApproved !== undefined) {
            filter.isApproved = isApproved;
        }
        if (minRating !== undefined) {
            filter.rating = { $gte: minRating };
        }
        if (search) {
            filter.$or = [
                { companyName: new RegExp(search, 'i') },
                { contactEmail: new RegExp(search, 'i') },
            ];
        }
        // Calculate pagination
        const skip = (page - 1) * limit;
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Execute query with pagination
        const [suppliers, total] = await Promise.all([
            model_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('catalogProducts.product', 'sku name category')
                .lean(),
            model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: suppliers,
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
     * Find supplier by ID
     */
    async findById(id) {
        const supplier = await model_1.default.findById(id)
            .populate('catalogProducts.product', 'sku name category unitPrice');
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        return supplier;
    }
    /**
     * Update supplier
     */
    async update(id, dto) {
        const supplier = await model_1.default.findById(id);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        // If email is being updated, check uniqueness
        if (dto.contactEmail && dto.contactEmail !== supplier.contactEmail) {
            const existingSupplier = await model_1.default.findOne({ contactEmail: dto.contactEmail });
            if (existingSupplier) {
                throw new ApiError_1.ApiError(409, `Supplier with email '${dto.contactEmail}' already exists`);
            }
        }
        // Update supplier
        Object.assign(supplier, dto);
        await supplier.save();
        return supplier;
    }
    /**
     * Delete supplier
     */
    async delete(id) {
        const supplier = await model_1.default.findById(id);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        // TODO: Check if supplier is referenced in products, POs, negotiations
        // Prevent deletion if in use
        await supplier.deleteOne();
    }
    /**
     * Add product to supplier's catalog
     */
    async addCatalogProduct(supplierId, productDto) {
        const supplier = await model_1.default.findById(supplierId);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        // Check if product already exists in catalog
        const existingProduct = supplier.catalogProducts.find((cp) => cp.product.toString() === productDto.product);
        if (existingProduct) {
            throw new ApiError_1.ApiError(409, 'Product already exists in supplier catalog');
        }
        // Validate product exists
        await this.validateProduct(productDto.product);
        // Add product to catalog
        const catalogProduct = {
            ...productDto,
            product: new mongoose_1.default.Types.ObjectId(productDto.product),
        };
        supplier.catalogProducts.push(catalogProduct);
        await supplier.save();
        return supplier;
    }
    /**
     * Update catalog product
     */
    async updateCatalogProduct(supplierId, productId, productDto) {
        const supplier = await model_1.default.findById(supplierId);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        const catalogProduct = supplier.catalogProducts.find((cp) => cp.product.toString() === productId);
        if (!catalogProduct) {
            throw new ApiError_1.ApiError(404, 'Product not found in supplier catalog');
        }
        // Update catalog product
        Object.assign(catalogProduct, productDto);
        await supplier.save();
        return supplier;
    }
    /**
     * Remove product from catalog
     */
    async removeCatalogProduct(supplierId, productId) {
        const supplier = await model_1.default.findById(supplierId);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        const productIndex = supplier.catalogProducts.findIndex((cp) => cp.product.toString() === productId);
        if (productIndex === -1) {
            throw new ApiError_1.ApiError(404, 'Product not found in supplier catalog');
        }
        supplier.catalogProducts.splice(productIndex, 1);
        await supplier.save();
        return supplier;
    }
    /**
     * Update supplier contract terms
     */
    async updateContractTerms(supplierId, termsDto) {
        const supplier = await model_1.default.findById(supplierId);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        supplier.currentContractTerms = termsDto;
        await supplier.save();
        return supplier;
    }
    /**
     * Approve supplier
     */
    async approveSupplier(supplierId) {
        const supplier = await model_1.default.findById(supplierId);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        if (supplier.isApproved) {
            throw new ApiError_1.ApiError(400, 'Supplier is already approved');
        }
        supplier.isApproved = true;
        await supplier.save();
        // TODO: Create notification for supplier user
        // TODO: Send email notification
        return supplier;
    }
    /**
     * Reject/Revoke supplier approval
     */
    async rejectSupplier(supplierId) {
        const supplier = await model_1.default.findById(supplierId);
        if (!supplier) {
            throw new ApiError_1.ApiError(404, 'Supplier not found');
        }
        supplier.isApproved = false;
        await supplier.save();
        // TODO: Create notification for supplier user
        // TODO: Send email notification
        return supplier;
    }
    /**
     * Get supplier performance metrics
     */
    async getPerformanceMetrics(supplierId) {
        const supplier = await this.findById(supplierId);
        const successRate = supplier.negotiationStats.totalNegotiations > 0
            ? (supplier.negotiationStats.acceptedOffers / supplier.negotiationStats.totalNegotiations) * 100
            : 0;
        let avgLeadTime = 0;
        let avgPrice = 0;
        if (supplier.catalogProducts.length > 0) {
            avgLeadTime = supplier.catalogProducts.reduce((sum, cp) => sum + cp.leadTimeDays, 0) / supplier.catalogProducts.length;
            avgPrice = supplier.catalogProducts.reduce((sum, cp) => sum + cp.unitPrice, 0) / supplier.catalogProducts.length;
        }
        return {
            supplier: {
                id: supplier._id.toString(),
                companyName: supplier.companyName,
                rating: supplier.rating,
            },
            negotiationStats: {
                totalNegotiations: supplier.negotiationStats.totalNegotiations,
                acceptedOffers: supplier.negotiationStats.acceptedOffers,
                successRate: parseFloat(successRate.toFixed(2)),
                averageSavingsPercent: supplier.negotiationStats.averageSavingsPercent,
            },
            catalogStats: {
                totalProducts: supplier.catalogProducts.length,
                averageLeadTime: parseFloat(avgLeadTime.toFixed(2)),
                averagePrice: parseFloat(avgPrice.toFixed(2)),
            },
        };
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
    /**
     * Validate catalog products
     * @private
     */
    async validateCatalogProducts(products) {
        for (const product of products) {
            await this.validateProduct(product.product);
        }
        // Check for duplicate products
        const productIds = products.map((p) => p.product);
        const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            throw new ApiError_1.ApiError(400, 'Duplicate products found in catalog');
        }
    }
    /**
     * Get supplier statistics
     */
    async getStatistics() {
        const [total, approved, avgRating, topSuppliers] = await Promise.all([
            model_1.default.countDocuments(),
            model_1.default.countDocuments({ isApproved: true }),
            model_1.default.aggregate([
                { $group: { _id: null, avgRating: { $avg: '$rating' } } },
            ]),
            model_1.default.find({ isApproved: true })
                .sort({ rating: -1 })
                .limit(5)
                .select('companyName rating catalogProducts'),
        ]);
        const averageRating = avgRating[0]?.avgRating || 0;
        return {
            total,
            approved,
            pending: total - approved,
            averageRating: parseFloat(averageRating.toFixed(2)),
            topSuppliers: topSuppliers.map((s) => ({
                companyName: s.companyName,
                rating: s.rating,
                totalProducts: s.catalogProducts.length,
            })),
        };
    }
}
exports.SupplierService = SupplierService;
