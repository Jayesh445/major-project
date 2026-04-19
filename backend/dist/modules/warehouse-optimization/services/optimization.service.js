"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationService = void 0;
const agent_1 = require("../../../ai/warehouse-optimization-agent/agent");
const model_1 = __importDefault(require("../model"));
class OptimizationService {
    // Generate new optimization recommendations
    static async generateRecommendations() {
        return await (0, agent_1.runOptimizationAgent)();
    }
    // Get latest optimization recommendation
    static async getLatestRecommendation() {
        return await model_1.default.findOne()
            .sort({ generatedAt: -1 })
            .populate('warehousesAnalysed', 'name code location')
            .populate('transferRecommendations.product', 'name sku')
            .populate('transferRecommendations.fromWarehouse', 'name code')
            .populate('transferRecommendations.toWarehouse', 'name code');
    }
    // Get recommendation by ID
    static async getRecommendationById(id) {
        return await model_1.default.findById(id)
            .populate('warehousesAnalysed', 'name code location')
            .populate('transferRecommendations.product', 'name sku')
            .populate('transferRecommendations.fromWarehouse', 'name code')
            .populate('transferRecommendations.toWarehouse', 'name code')
            .populate('reviewedBy', 'name email');
    }
    // Get all recommendations with pagination
    static async getRecommendations(options) {
        const { status, limit = 10, skip = 0 } = options;
        const query = {};
        if (status) {
            query.status = status;
        }
        const [recommendations, total] = await Promise.all([
            model_1.default.find(query)
                .sort({ generatedAt: -1 })
                .limit(limit)
                .skip(skip)
                .populate('warehousesAnalysed', 'name code')
                .populate('reviewedBy', 'name email'),
            model_1.default.countDocuments(query),
        ]);
        return {
            recommendations,
            total,
            page: Math.floor(skip / limit) + 1,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Update recommendation status (accept/reject)
    static async updateRecommendationStatus(id, status, reviewedBy, reviewNotes) {
        return await model_1.default.findByIdAndUpdate(id, {
            status,
            reviewedBy,
            reviewedAt: new Date(),
            reviewNotes,
        }, { new: true })
            .populate('warehousesAnalysed', 'name code')
            .populate('transferRecommendations.product', 'name sku')
            .populate('transferRecommendations.fromWarehouse', 'name code')
            .populate('transferRecommendations.toWarehouse', 'name code')
            .populate('reviewedBy', 'name email');
    }
    // Get performance metrics
    static async getPerformanceMetrics() {
        const recommendations = await model_1.default.find()
            .select('generationDurationSeconds status predictedLogisticsCostReductionPercent')
            .lean();
        const totalRuns = recommendations.length;
        const avgDuration = recommendations.reduce((sum, r) => sum + r.generationDurationSeconds, 0) / totalRuns;
        const maxDuration = Math.max(...recommendations.map(r => r.generationDurationSeconds));
        const statusCounts = recommendations.reduce((acc, r) => {
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
exports.OptimizationService = OptimizationService;
