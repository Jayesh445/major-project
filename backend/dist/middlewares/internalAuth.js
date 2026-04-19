"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalAuth = internalAuth;
/**
 * Middleware for internal service-to-service authentication.
 * Validates the X-Internal-Api-Key header against the INTERNAL_API_KEY env var.
 * Used by /api/internal routes called from the Mastra AI module.
 */
function internalAuth(req, res, next) {
    const key = req.headers['x-internal-api-key'];
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected) {
        res.status(500).json({ message: 'INTERNAL_API_KEY is not configured on the server' });
        return;
    }
    if (!key || key !== expected) {
        res.status(401).json({ message: 'Unauthorized: invalid internal API key' });
        return;
    }
    next();
}
