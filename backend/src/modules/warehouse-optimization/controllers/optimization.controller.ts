import { Request, Response } from 'express';
import { OptimizationService } from '../services/optimization.service';
import { ApiResponse } from '../../../utils/ApiResponse';

export class OptimizationController {
  // Generate new optimization recommendations
  static async generateRecommendations(req: Request, res: Response) {
    const result = await OptimizationService.generateRecommendations();

    if (!result.success) {
      return res.status(500).json(
        new ApiResponse(500, { errors: result.errors }, 'Optimization generation failed')
      );
    }

    const latest = await OptimizationService.getLatestRecommendation();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          recommendation: latest,
          durationSeconds: result.durationSeconds,
        },
        'Optimization recommendations generated successfully'
      )
    );
  }

  // Get latest recommendation
  static async getLatestRecommendation(req: Request, res: Response) {
    const recommendation = await OptimizationService.getLatestRecommendation();

    if (!recommendation) {
      return res.status(404).json(
        new ApiResponse(404, null, 'No optimization recommendations found')
      );
    }

    return res.status(200).json(
      new ApiResponse(200, recommendation, 'Latest recommendation retrieved successfully')
    );
  }

  // Get recommendation by ID
  static async getRecommendationById(req: Request, res: Response) {
    const id = req.params.id as string;

    const recommendation = await OptimizationService.getRecommendationById(id);

    if (!recommendation) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Recommendation not found')
      );
    }

    return res.status(200).json(
      new ApiResponse(200, recommendation, 'Recommendation retrieved successfully')
    );
  }

  // Get all recommendations with filters
  static async getRecommendations(req: Request, res: Response) {
    const statusParam = req.query.status;
    const limitParam = req.query.limit;
    const pageParam = req.query.page;

    const status = typeof statusParam === 'string' ? statusParam : undefined;

    let limit = 10;
    if (limitParam) {
      const limitStr = Array.isArray(limitParam) ? limitParam[0] : limitParam;
      limit = typeof limitStr === 'string' ? parseInt(limitStr, 10) : 10;
    }

    let page = 1;
    if (pageParam) {
      const pageStr = Array.isArray(pageParam) ? pageParam[0] : pageParam;
      page = typeof pageStr === 'string' ? parseInt(pageStr, 10) : 1;
    }

    const skip = (page - 1) * limit;

    const result = await OptimizationService.getRecommendations({
      status,
      limit,
      skip,
    });

    return res.status(200).json(
      new ApiResponse(200, result, 'Recommendations retrieved successfully')
    );
  }

  // Update recommendation status
  static async updateRecommendationStatus(req: Request, res: Response) {
    const id = req.params.id as string;
    const { status, reviewNotes } = req.body;

    // TODO: Get reviewedBy from authenticated user
    // For now, using a placeholder
    const reviewedBy = req.body.reviewedBy || '507f1f77bcf86cd799439011';

    if (!['accepted', 'partially_accepted', 'rejected'].includes(status)) {
      return res.status(400).json(
        new ApiResponse(400, null, 'Invalid status. Must be accepted, partially_accepted, or rejected')
      );
    }

    const recommendation = await OptimizationService.updateRecommendationStatus(
      id,
      status,
      reviewedBy,
      reviewNotes
    );

    if (!recommendation) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Recommendation not found')
      );
    }

    return res.status(200).json(
      new ApiResponse(200, recommendation, 'Recommendation status updated successfully')
    );
  }

  // Get performance metrics
  static async getPerformanceMetrics(req: Request, res: Response) {
    const metrics = await OptimizationService.getPerformanceMetrics();

    return res.status(200).json(
      new ApiResponse(200, metrics, 'Performance metrics retrieved successfully')
    );
  }
}
