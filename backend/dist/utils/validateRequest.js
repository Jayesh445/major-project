"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = exports.validateRequest = void 0;
const zod_1 = require("zod");
const ApiError_1 = require("./ApiError");
/**
 * Middleware to validate request body, query, or params using Zod schema
 */
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                next(error);
            }
            else {
                next(new ApiError_1.ApiError(400, 'Validation failed'));
            }
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Validate only request body
 */
const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateBody = validateBody;
/**
 * Validate only query parameters
 */
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
/**
 * Validate only route parameters
 */
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            req.params = await schema.parseAsync(req.params);
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateParams = validateParams;
