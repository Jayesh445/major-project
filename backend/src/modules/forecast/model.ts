import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Daily forecast details
 */
export interface IDailyForecast {
  date: Date;
  predictedDemand: number;
  confidenceLow: number;
  confidenceHigh: number;
  actualDemand?: number;
  mape?: number;
}

/**
 * Demand forecast document interface
 */
export interface IDemandForecast extends Document {
  product: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  forecastedAt: Date;
  forecastHorizonDays: number;
  dailyForecasts: IDailyForecast[];
  totalPredicted7Day: number;
  overallMape?: number;
  modelVersion: string;
  recommendedReorderQty?: number;
  recommendedOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily forecast subdocument schema
 */
const DailyForecastSchema = new Schema<IDailyForecast>(
  {
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
  },
  { _id: true }
);

/**
 * Demand forecast schema definition
 */
const DemandForecastSchema = new Schema<IDemandForecast>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    warehouse: {
      type: Schema.Types.ObjectId,
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
        validator: function (forecasts: IDailyForecast[]) {
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
  },
  {
    timestamps: true,
  }
);

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
const DemandForecast: Model<IDemandForecast> = mongoose.model<IDemandForecast>(
  'DemandForecast',
  DemandForecastSchema
);

export default DemandForecast;
