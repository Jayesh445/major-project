"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendNoContent = exports.sendCreated = exports.sendSuccess = void 0;
const ApiResponse_1 = require("./ApiResponse");
/**
 * Send standardized success response
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json(new ApiResponse_1.ApiResponse(statusCode, data, message));
};
exports.sendSuccess = sendSuccess;
/**
 * Send created response (201)
 */
const sendCreated = (res, data, message = 'Created') => {
    return (0, exports.sendSuccess)(res, data, message, 201);
};
exports.sendCreated = sendCreated;
/**
 * Send no content response (204)
 */
const sendNoContent = (res) => {
    return res.status(204).send();
};
exports.sendNoContent = sendNoContent;
/**
 * Send paginated response
 */
const sendPaginated = (res, data, page, limit, total, message = 'Success') => {
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, {
        items: data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    }, message));
};
exports.sendPaginated = sendPaginated;
