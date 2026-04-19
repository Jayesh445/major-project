"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const service_1 = __importDefault(require("@/modules/user/service"));
const ApiError_1 = require("@/utils/ApiError");
const constants_1 = require("@/utils/constants");
/**
 * Authentication middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'No token provided');
        }
        const token = authHeader.split(' ')[1];
        // Verify token
        const payload = service_1.default.verifyToken(token);
        // Attach user to request
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof ApiError_1.ApiError) {
            next(error);
        }
        else {
            next(new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'Invalid or expired token'));
        }
    }
};
exports.authenticate = authenticate;
/**
 * Authorization middleware to check if user has required role(s)
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not authenticated');
            }
            if (!allowedRoles.includes(req.user.role)) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.FORBIDDEN, 'You do not have permission to access this resource');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = service_1.default.verifyToken(token);
            req.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
            };
        }
        next();
    }
    catch (error) {
        // Continue without authentication
        next();
    }
};
exports.optionalAuth = optionalAuth;
