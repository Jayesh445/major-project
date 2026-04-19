"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiMessages = exports.HttpStatus = void 0;
/**
 * HTTP Status Codes
 */
exports.HttpStatus = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
};
/**
 * Common API Messages
 */
exports.ApiMessages = {
    SUCCESS: 'Operation successful',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    BAD_REQUEST: 'Invalid request',
    INTERNAL_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
};
