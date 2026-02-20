import { runOptimizationAgent } from '../../../ai/warehouse-optimization-agent/agent';
import WarehouseOptimizationRecommendation from '../model';

export class OptimizationService {
  // Generate new optimization recommendations
  static async generateRecommendations() {
    return await runOptimizationAgent();
  }

  // Get latest optimization recommendation
  static async getLatestRecommendation() {
    return await WarehouseOptimizationRecommendation.findOne()
      .sort({ generatedAt: -1 })
      .populate('warehousesAnalysed', 'name code location')
      .populate('transferRecommendations.product', 'name sku')
      .populate('transferRecommendations.fromWarehouse', 'name code')
      .populate('transferRecommendations.toWarehouse', 'name code');
  }

  // Get recommendation by ID
  static async getRecommendationById(id: string) {
    return await WarehouseOptimizationRecommendation.findById(id)
      .populate('warehousesAnalysed', 'name code location')
      .populate('transferRecommendations.product', 'name sku')
      .populate('transferRecommendations.fromWarehouse', 'name code')
      .populate('transferRecommendations.toWarehouse', 'name code')
      .populate('reviewedBy', 'name email');
  }

  // Get all recommendations with pagination
  static async getRecommendations(options: {
    status?: string;
    limit?: number;
    skip?: number;
  }) {
    const { status, limit = 10, skip = 0 } = options;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [recommendations, total] = await Promise.all([
      WarehouseOptimizationRecommendation.find(query)
        .sort({ generatedAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('warehousesAnalysed', 'name code')
        .populate('reviewedBy', 'name email'),
      WarehouseOptimizationRecommendation.countDocuments(query),
    ]);

    return {
      recommendations,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Update recommendation status (accept/reject)
  static async updateRecommendationStatus(
    id: string,
    status: 'accepted' | 'partially_accepted' | 'rejected',
    reviewedBy: string,
    reviewNotes?: string
  ) {
    return await WarehouseOptimizationRecommendation.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes,
      },
      { new: true }
    )
      .populate('warehousesAnalysed', 'name code')
      .populate('transferRecommendations.product', 'name sku')
      .populate('transferRecommendations.fromWarehouse', 'name code')
      .populate('transferRecommendations.toWarehouse', 'name code')
      .populate('reviewedBy', 'name email');
  }

  // Get performance metrics
  static async getPerformanceMetrics() {
    const recommendations = await WarehouseOptimizationRecommendation.find()
      .select('generationDurationSeconds status predictedLogisticsCostReductionPercent')
      .lean();

    const totalRuns = recommendations.length;
    const avgDuration = recommendations.reduce((sum, r) => sum + r.generationDurationSeconds, 0) / totalRuns;
    const maxDuration = Math.max(...recommendations.map(r => r.generationDurationSeconds));

    const statusCounts = recommendations.reduce((acc: any, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const avgCostReduction = recommendations
      .filter(r => r.predictedLogisticsCostReductionPercent)
      .reduce((sum, r) => sum + (r.predictedLogisticsCostReductionPercent || 0), 0) / totalRuns;

    return {
      totalRuns,
      avgDurationSeconds: avgDuration,
      maxDurationSeconds: maxDuration,
      statusBreakdown: statusCounts,
      avgPredictedCostReduction: avgCostReduction,
    };
  }
}
