import Supplier, { ISupplier, ICatalogProduct } from './model';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateSupplierDto,
  UpdateSupplierDto,
  AddCatalogProductDto,
  UpdateCatalogProductDto,
  UpdateContractTermsDto,
  QuerySuppliersDto,
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
 * Supplier service class
 * Handles all business logic for supplier operations
 */
export class SupplierService {
  /**
   * Create a new supplier
   */
  async create(dto: CreateSupplierDto): Promise<ISupplier> {
    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({ contactEmail: dto.contactEmail });
    if (existingSupplier) {
      throw new ApiError(409, `Supplier with email '${dto.contactEmail}' already exists`);
    }

    // Validate catalog products if provided
    if (dto.catalogProducts && dto.catalogProducts.length > 0) {
      await this.validateCatalogProducts(dto.catalogProducts);
    }

    const supplier = new Supplier(dto);
    await supplier.save();

    return supplier;
  }

  /**
   * Get all suppliers with filtering and pagination
   */
  async findAll(query: QuerySuppliersDto): Promise<PaginatedResult<ISupplier>> {
    const { page, limit, isApproved, minRating, search, sortBy, sortOrder } = query;

    // Build filter query
    const filter: any = {};

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
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('catalogProducts.product', 'sku name category')
        .lean(),
      Supplier.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: suppliers as ISupplier[],
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
  async findById(id: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(id)
      .populate('catalogProducts.product', 'sku name category unitPrice');

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    return supplier;
  }

  /**
   * Update supplier
   */
  async update(id: string, dto: UpdateSupplierDto): Promise<ISupplier> {
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    // If email is being updated, check uniqueness
    if (dto.contactEmail && dto.contactEmail !== supplier.contactEmail) {
      const existingSupplier = await Supplier.findOne({ contactEmail: dto.contactEmail });
      if (existingSupplier) {
        throw new ApiError(409, `Supplier with email '${dto.contactEmail}' already exists`);
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
  async delete(id: string): Promise<void> {
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    // TODO: Check if supplier is referenced in products, POs, negotiations
    // Prevent deletion if in use

    await supplier.deleteOne();
  }

  /**
   * Add product to supplier's catalog
   */
  async addCatalogProduct(supplierId: string, productDto: AddCatalogProductDto): Promise<ISupplier> {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    // Check if product already exists in catalog
    const existingProduct = supplier.catalogProducts.find(
      (cp) => cp.product.toString() === productDto.product
    );

    if (existingProduct) {
      throw new ApiError(409, 'Product already exists in supplier catalog');
    }

    // Validate product exists
    await this.validateProduct(productDto.product);

    // Add product to catalog
    supplier.catalogProducts.push(productDto as ICatalogProduct);
    await supplier.save();

    return supplier;
  }

  /**
   * Update catalog product
   */
  async updateCatalogProduct(
    supplierId: string,
    productId: string,
    productDto: UpdateCatalogProductDto
  ): Promise<ISupplier> {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    const catalogProduct = supplier.catalogProducts.find(
      (cp) => cp.product.toString() === productId
    );

    if (!catalogProduct) {
      throw new ApiError(404, 'Product not found in supplier catalog');
    }

    // Update catalog product
    Object.assign(catalogProduct, productDto);
    await supplier.save();

    return supplier;
  }

  /**
   * Remove product from catalog
   */
  async removeCatalogProduct(supplierId: string, productId: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    const productIndex = supplier.catalogProducts.findIndex(
      (cp) => cp.product.toString() === productId
    );

    if (productIndex === -1) {
      throw new ApiError(404, 'Product not found in supplier catalog');
    }

    supplier.catalogProducts.splice(productIndex, 1);
    await supplier.save();

    return supplier;
  }

  /**
   * Update supplier contract terms
   */
  async updateContractTerms(supplierId: string, termsDto: UpdateContractTermsDto): Promise<ISupplier> {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    supplier.currentContractTerms = termsDto as any;
    await supplier.save();

    return supplier;
  }

  /**
   * Approve supplier
   */
  async approveSupplier(supplierId: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    if (supplier.isApproved) {
      throw new ApiError(400, 'Supplier is already approved');
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
  async rejectSupplier(supplierId: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
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
  async getPerformanceMetrics(supplierId: string): Promise<{
    supplier: {
      id: string;
      companyName: string;
      rating: number;
    };
    negotiationStats: {
      totalNegotiations: number;
      acceptedOffers: number;
      successRate: number;
      averageSavingsPercent: number;
    };
    catalogStats: {
      totalProducts: number;
      averageLeadTime: number;
      averagePrice: number;
    };
  }> {
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
   * Validate catalog products
   * @private
   */
  private async validateCatalogProducts(products: AddCatalogProductDto[]): Promise<void> {
    for (const product of products) {
      await this.validateProduct(product.product);
    }

    // Check for duplicate products
    const productIds = products.map((p) => p.product);
    const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);

    if (duplicates.length > 0) {
      throw new ApiError(400, 'Duplicate products found in catalog');
    }
  }

  /**
   * Get supplier statistics
   */
  async getStatistics(): Promise<{
    total: number;
    approved: number;
    pending: number;
    averageRating: number;
    topSuppliers: Array<{ companyName: string; rating: number; totalProducts: number }>;
  }> {
    const [total, approved, avgRating, topSuppliers] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ isApproved: true }),
      Supplier.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
      Supplier.find({ isApproved: true })
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
