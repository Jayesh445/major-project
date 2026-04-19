"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const ApiError_1 = require("@/utils/ApiError");
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = [];
    // Handle ApiError
    if (err instanceof ApiError_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }
    // Handle Zod validation errors
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        const issues = err.issues ?? err.errors ?? [];
        errors = issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
    }
    // Handle Mongoose validation errors
    else if (err.name === 'ValidationError' && err instanceof mongoose_1.MongooseError) {
        statusCode = 400;
        message = 'Validation Error';
        errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message,
        }));
    }
    // Handle Mongoose duplicate key error
    else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate Entry';
        const field = Object.keys(err.keyPattern)[0];
        errors = [{ field, message: `${field} already exists` }];
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: errors.length > 0 ? errors : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError_1.ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
