import Product, { IProduct } from './model';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
  SearchProductsDto,
  BulkUploadProductDto,
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
 * Product service class
 * Handles all business logic for product operations
 */
export class ProductService {
  /**
   * Create a new product
   */
  async create(dto: CreateProductDto, userId: string): Promise<IProduct> {
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: dto.sku });
    if (existingProduct) {
      throw new ApiError(409, `Product with SKU '${dto.sku}' already exists`);
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
    const product = new Product({
      ...dto,
      uploadedBy: userId,
    });

    await product.save();
    return product;
  }

  /**
   * Get all products with filtering and pagination
   */
  async findAll(query: QueryProductsDto): Promise<PaginatedResult<IProduct>> {
    const { page, limit, category, isActive, primarySupplier, minPrice, maxPrice, sortBy, sortOrder } = query;

    // Build filter query
    const filter: any = {};

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
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('primarySupplier', 'companyName contactEmail rating')
        .populate('alternateSuppliers', 'companyName contactEmail rating')
        .populate('uploadedBy', 'name email')
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products as IProduct[],
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
  async search(query: SearchProductsDto): Promise<PaginatedResult<IProduct>> {
    const { query: searchQuery, page, limit, category } = query;

    // Build filter
    const filter: any = {
      $text: { $search: searchQuery },
    };

    if (category) {
      filter.category = category;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('primarySupplier', 'companyName contactEmail rating')
        .populate('uploadedBy', 'name email')
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products as IProduct[],
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
  async findById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('primarySupplier', 'companyName contactEmail contactPhone rating')
      .populate('alternateSuppliers', 'companyName contactEmail rating')
      .populate('uploadedBy', 'name email');

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    return product;
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string): Promise<IProduct | null> {
    return Product.findOne({ sku: sku.toUpperCase() })
      .populate('primarySupplier')
      .populate('uploadedBy', 'name email');
  }

  /**
   * Update product
   */
  async update(id: string, dto: UpdateProductDto): Promise<IProduct> {
    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // If SKU is being updated, check uniqueness
    if (dto.sku && dto.sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku: dto.sku });
      if (existingProduct) {
        throw new ApiError(409, `Product with SKU '${dto.sku}' already exists`);
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
  async softDelete(id: string): Promise<IProduct> {
    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    product.isActive = false;
    await product.save();

    return product;
  }

  /**
   * Hard delete product (permanent deletion)
   */
  async delete(id: string): Promise<void> {
    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // TODO: Check if product is referenced in inventory, POs, etc.
    // Prevent deletion if in use

    await product.deleteOne();
  }

  /**
   * Bulk upload products
   */
  async bulkUpload(products: BulkUploadProductDto, userId: string): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; sku: string; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; sku: string; error: string }>,
    };

    for (let i = 0; i < products.length; i++) {
      try {
        await this.create(products[i], userId);
        results.success++;
      } catch (error: any) {
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
  async findByCategory(category: string, limit: number = 10): Promise<IProduct[]> {
    return Product.find({ category, isActive: true })
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('primarySupplier', 'companyName rating');
  }

  /**
   * Get low stock products (where inventory is below reorder point)
   * This will be used in conjunction with Inventory module
   */
  async getLowStockProducts(): Promise<IProduct[]> {
    // This is a placeholder - actual implementation requires joining with Inventory
    return Product.find({ isActive: true })
      .populate('primarySupplier', 'companyName contactEmail');
  }

  /**
   * Validate supplier exists
   * @private
   */
  private async validateSupplier(supplierId: string): Promise<void> {
    // Import Supplier model dynamically to avoid circular dependency
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
   * Get product statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
  }> {
    const [total, active, byCategory] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const categoryCounts: Record<string, number> = {};
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
