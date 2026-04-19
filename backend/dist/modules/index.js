"use strict";
/**
 * Barrel export file for all Mongoose models
 *
 * This file provides a centralized export point for all models,
 * making it easy to import them throughout the application.
 *
 * Usage:
 * import { User, Product, Warehouse } from '@/modules';
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseOptimizationRecommendation = exports.Notification = exports.BlockchainLog = exports.DemandForecast = exports.NegotiationSession = exports.PurchaseOrder = exports.Inventory = exports.Product = exports.Supplier = exports.Warehouse = exports.User = void 0;
// User and Authentication
var model_1 = require("./user/model");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(model_1).default; } });
// Warehouse Management
var model_2 = require("./warehouse/model");
Object.defineProperty(exports, "Warehouse", { enumerable: true, get: function () { return __importDefault(model_2).default; } });
// Supplier Management
var model_3 = require("./supplier/model");
Object.defineProperty(exports, "Supplier", { enumerable: true, get: function () { return __importDefault(model_3).default; } });
// Product Catalog
var model_4 = require("./product/model");
Object.defineProperty(exports, "Product", { enumerable: true, get: function () { return __importDefault(model_4).default; } });
// Inventory Management
var model_5 = require("./inventory/model");
Object.defineProperty(exports, "Inventory", { enumerable: true, get: function () { return __importDefault(model_5).default; } });
// Purchase Orders
var model_6 = require("./purchase-order/model");
Object.defineProperty(exports, "PurchaseOrder", { enumerable: true, get: function () { return __importDefault(model_6).default; } });
// Negotiation Sessions
var model_7 = require("./negotiation/model");
Object.defineProperty(exports, "NegotiationSession", { enumerable: true, get: function () { return __importDefault(model_7).default; } });
// Demand Forecasting
var model_8 = require("./forecast/model");
Object.defineProperty(exports, "DemandForecast", { enumerable: true, get: function () { return __importDefault(model_8).default; } });
// Blockchain Logging
var model_9 = require("./blockchain/model");
Object.defineProperty(exports, "BlockchainLog", { enumerable: true, get: function () { return __importDefault(model_9).default; } });
// Notifications
var model_10 = require("./notification/model");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return __importDefault(model_10).default; } });
// Warehouse Optimization
var model_11 = require("./warehouse-optimization/model");
Object.defineProperty(exports, "WarehouseOptimizationRecommendation", { enumerable: true, get: function () { return __importDefault(model_11).default; } });
