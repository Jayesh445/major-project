"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Daily forecast subdocument schema
 */
const DailyForecastSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: [true, 'Forecast date is required'],
    },
    predictedDemand: {
        type: Number,
        required: [true, 'Predicted demand is required'],
        min: [0, 'Predicted demand cannot be negative'],
    },
    confidenceLow: {
        type: Number,
        required: [true, 'Confidence interval low is required'],
        min: [0, 'Confidence low cannot be negative'],
    },
    confidenceHigh: {
        type: Number,
        required: [true, 'Confidence interval high is required'],
        min: [0, 'Confidence high cannot be negative'],
    },
    actualDemand: {
        type: Number,
        min: [0, 'Actual demand cannot be negative'],
    },
    mape: {
        type: Number,
        min: [0, 'MAPE cannot be negative'],
        max: [100, 'MAPE cannot exceed 100%'],
    },
}, { _id: true });
/**
 * Demand forecast schema definition
 */
const DemandForecastSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product reference is required'],
    },
    warehouse: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'Warehouse reference is required'],
    },
    forecastedAt: {
        type: Date,
        required: [true, 'Forecasted at timestamp is required'],
        default: Date.now,
    },
    forecastHorizonDays: {
        type: Number,
        required: [true, 'Forecast horizon is required'],
        min: [1, 'Forecast horizon must be at least 1 day'],
        default: 7,
    },
    dailyForecasts: {
        type: [DailyForecastSchema],
        required: [true, 'Daily forecasts are required'],
        validate: {
            validator: function (forecasts) {
                return forecasts && forecasts.length > 0;
            },
            message: 'At least one daily forecast is required',
        },
    },
    totalPredicted7Day: {
        type: Number,
        required: [true, 'Total 7-day prediction is required'],
        min: [0, 'Total predicted demand cannot be negative'],
    },
    overallMape: {
        type: Number,
        min: [0, 'Overall MAPE cannot be negative'],
        max: [100, 'Overall MAPE cannot exceed 100%'],
    },
    modelVersion: {
        type: String,
        required: [true, 'Model version is required'],
        trim: true,
        default: 'arima-v1',
    },
    recommendedReorderQty: {
        type: Number,
        min: [0, 'Recommended reorder quantity cannot be negative'],
    },
    recommendedOrderDate: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes
// Compound index for retrieving latest forecast per product per warehouse
DemandForecastSchema.index({ product: 1, warehouse: 1, forecastedAt: -1 });
DemandForecastSchema.index({ product: 1 });
DemandForecastSchema.index({ warehouse: 1 });
DemandForecastSchema.index({ forecastedAt: -1 });
// Index for MAPE performance tracking
DemandForecastSchema.index({ overallMape: 1 }, { sparse: true });
// Compound index for model version tracking
DemandForecastSchema.index({ modelVersion: 1, forecastedAt: -1 });
/**
 * Demand forecast model
 */
const DemandForecast = mongoose_1.default.model('DemandForecast', DemandForecastSchema);
exports.default = DemandForecast;
