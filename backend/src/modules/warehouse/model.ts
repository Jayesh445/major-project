import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Zone type options
 */
export type ZoneType = 'bulk' | 'fast_moving' | 'slow_moving' | 'fragile' | 'general';

/**
 * Geographic coordinates
 */
export interface ICoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Location details
 */
export interface ILocation {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  coordinates?: ICoordinates;
}

/**
 * Warehouse zone subdocument
 */
export interface IZone {
  zoneCode: string;
  type: ZoneType;
  capacityUnits: number;
  currentLoad: number;
}

/**
 * Warehouse document interface
 */
export interface IWarehouse extends Document {
  name: string;
  code: string;
  location: ILocation;
  totalCapacity: number;
  usedCapacity: number;
  zones: IZone[];
  manager?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Coordinates subdocument schema
 */
const CoordinatesSchema = new Schema<ICoordinates>(
  {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  { _id: false }
);

/**
 * Location subdocument schema
 */
const LocationSchema = new Schema<ILocation>(
  {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    coordinates: {
      type: CoordinatesSchema,
    },
  },
  { _id: false }
);

/**
 * Zone subdocument schema
 */
const ZoneSchema = new Schema<IZone>(
  {
    zoneCode: {
      type: String,
      required: [true, 'Zone code is required'],
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Zone type is required'],
      enum: {
        values: ['bulk', 'fast_moving', 'slow_moving', 'fragile', 'general'],
        message: '{VALUE} is not a valid zone type',
      },
    },
    capacityUnits: {
      type: Number,
      required: [true, 'Capacity units is required'],
      min: [0, 'Capacity units cannot be negative'],
    },
    currentLoad: {
      type: Number,
      required: [true, 'Current load is required'],
      min: [0, 'Current load cannot be negative'],
      default: 0,
    },
  },
  { _id: true }
);

/**
 * Warehouse schema definition
 */
const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{3,10}$/, 'Warehouse code must be 3-10 alphanumeric characters'],
    },
    location: {
      type: LocationSchema,
      required: [true, 'Location is required'],
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [0, 'Total capacity cannot be negative'],
    },
    usedCapacity: {
      type: Number,
      required: [true, 'Used capacity is required'],
      min: [0, 'Used capacity cannot be negative'],
      default: 0,
    },
    zones: {
      type: [ZoneSchema],
      default: [],
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WarehouseSchema.index({ code: 1 });
WarehouseSchema.index({ 'location.city': 1 });
WarehouseSchema.index({ 'location.state': 1 });
WarehouseSchema.index({ isActive: 1 });
WarehouseSchema.index({ manager: 1 }, { sparse: true });

// Compound index for location-based queries
WarehouseSchema.index({ 'location.city': 1, 'location.state': 1 });

/**
 * Warehouse model
 */
const Warehouse: Model<IWarehouse> = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

export default Warehouse;
