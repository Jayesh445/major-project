import { Response } from 'express';
import { ApiResponse } from './ApiResponse';

/**
 * Send standardized success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(res: Response, data: T, message = 'Created') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response) => {
  return res.status(204).send();
};

/**
 * Send paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = 'Success'
) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      message
    )
  );
};
