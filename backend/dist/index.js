"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const middlewares_1 = require("@/middlewares");
const utils_1 = require("@/utils");
const config_1 = require("@/config");
const routes_1 = __importDefault(require("@/modules/user/routes"));
const routes_2 = __importDefault(require("@/modules/product/routes"));
const routes_3 = __importDefault(require("@/modules/warehouse/routes"));
const routes_4 = __importDefault(require("@/modules/supplier/routes"));
const routes_5 = __importDefault(require("@/modules/inventory/routes"));
const routes_6 = __importDefault(require("@/modules/purchase-order/routes"));
const routes_7 = __importDefault(require("@/modules/negotiation/routes"));
const forecast_routes_1 = __importDefault(require("@/modules/forecast/routes/forecast.routes"));
const optimization_routes_1 = __importDefault(require("@/modules/warehouse-optimization/routes/optimization.routes"));
const dashboard_routes_1 = __importDefault(require("@/modules/dashboard/dashboard.routes"));
const internal_routes_1 = __importDefault(require("@/modules/internal/internal.routes"));
const internalAuth_1 = require("@/middlewares/internalAuth");
const scheduler_service_1 = require("@/modules/forecast/services/scheduler.service");
const agent_routes_1 = __importDefault(require("@/modules/agents/agent.routes"));
const routes_8 = __importDefault(require("@/modules/blockchain/routes"));
const qr_routes_1 = __importDefault(require("@/modules/qr/qr.routes"));
const worker_1 = require("@/modules/blockchain/worker");
const app = (0, express_1.default)();
const PORT = parseInt(config_1.env.PORT, 10);
// Middleware
app.use((0, cors_1.default)());
// Capture raw body for webhook signature verification
// Must come before express.json() to intercept the raw stream
app.use((req, res, next) => {
    if (req.path === '/api/blockchain/webhook') {
        let rawBody = '';
        req.on('data', (chunk) => {
            rawBody += chunk.toString();
        });
        req.on('end', () => {
            req.rawBody = rawBody;
            next();
        });
    }
    else {
        next();
    }
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/v1/users', routes_1.default);
app.use('/api/v1/products', routes_2.default);
app.use('/api/v1/warehouses', routes_3.default);
app.use('/api/v1/suppliers', routes_4.default);
app.use('/api/v1/inventory', routes_5.default);
app.use('/api/v1/purchase-orders', routes_6.default);
app.use('/api/v1/negotiations', routes_7.default);
app.use('/api/forecast', forecast_routes_1.default);
app.use('/api/warehouse-optimization', optimization_routes_1.default);
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.use('/api/agents', agent_routes_1.default);
app.use('/api/blockchain', routes_8.default);
app.use('/api/qr', qr_routes_1.default);
app.use('/api/internal', internalAuth_1.internalAuth, internal_routes_1.default);
// Example route using utilities
app.get('/api/example', (0, utils_1.asyncHandler)(async (req, res) => {
    const data = { message: 'Hello from API' };
    return (0, utils_1.sendSuccess)(res, data, 'Data fetched successfully');
}));
// Example error route
app.get('/api/error-example', (0, utils_1.asyncHandler)(async (req, res) => {
    throw new utils_1.ApiError(utils_1.HttpStatus.BAD_REQUEST, 'This is a custom error');
}));
// Error handling middleware (must be last)
app.use(middlewares_1.notFoundHandler);
app.use(middlewares_1.errorHandler);
const startServer = async () => {
    await config_1.database.connect();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        // Start forecast scheduler
        scheduler_service_1.ForecastScheduler.start();
        // Start blockchain confirmation worker
        (0, worker_1.startConfirmationWorker)();
    });
};
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    scheduler_service_1.ForecastScheduler.stop();
    (0, worker_1.stopConfirmationWorker)();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    scheduler_service_1.ForecastScheduler.stop();
    (0, worker_1.stopConfirmationWorker)();
    process.exit(0);
});
exports.default = app;
