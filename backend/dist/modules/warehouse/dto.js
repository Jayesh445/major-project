"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneIdSchema = exports.WarehouseIdSchema = exports.QueryWarehousesSchema = exports.UpdateZoneSchema = exports.AddZoneSchema = exports.UpdateWarehouseSchema = exports.CreateWarehouseSchema = exports.ZoneSchema = exports.LocationSchema = exports.CoordinatesSchema = exports.ZoneTypeEnum = void 0;
const zod_1 = require("zod");
/**
 * Zone type enum
 */
exports.ZoneTypeEnum = zod_1.z.enum([
    'bulk',
    'fast_moving',
    'slow_moving',
    'fragile',
    'general',
]);
/**
 * Coordinates schema
 */
exports.CoordinatesSchema = zod_1.z.object({
    latitude: zod_1.z
        .number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90'),
    longitude: zod_1.z
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),
});
/**
 * Location schema
 */
exports.LocationSchema = zod_1.z.object({
    address: zod_1.z.string().min(5, 'Address must be at least 5 characters').trim(),
    city: zod_1.z.string().min(2, 'City must be at least 2 characters').trim(),
    state: zod_1.z.string().min(2, 'State must be at least 2 characters').trim(),
    country: zod_1.z.string().trim().default('India'),
    pincode: zod_1.z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be 6 digits')
        .trim(),
    coordinates: exports.CoordinatesSchema.optional(),
});
/**
 * Zone schema
 */
exports.ZoneSchema = zod_1.z.object({
    zoneCode: zod_1.z
        .string()
        .min(1, 'Zone code is required')
        .max(10, 'Zone code cannot exceed 10 characters')
        .transform((val) => val.toUpperCase()),
    type: exports.ZoneTypeEnum,
    capacityUnits: zod_1.z
        .number()
        .min(0, 'Capacity units cannot be negative')
        .int('Capacity units must be an integer'),
    currentLoad: zod_1.z
        .number()
        .min(0, 'Current load cannot be negative')
        .int('Current load must be an integer')
        .default(0),
});
/**
 * Create warehouse DTO
 */
exports.CreateWarehouseSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'Warehouse name must be at least 2 characters')
        .max(100, 'Warehouse name cannot exceed 100 characters')
        .trim(),
    code: zod_1.z
        .string()
        .min(3, 'Warehouse code must be at least 3 characters')
        .max(10, 'Warehouse code cannot exceed 10 characters')
        .regex(/^[A-Z0-9]+$/, 'Warehouse code must contain only uppercase letters and numbers')
        .transform((val) => val.toUpperCase()),
    location: exports.LocationSchema,
    totalCapacity: zod_1.z
        .number()
        .min(1, 'Total capacity must be at least 1')
        .int('Total capacity must be an integer'),
    usedCapacity: zod_1.z
        .number()
        .min(0, 'Used capacity cannot be negative')
        .int('Used capacity must be an integer')
        .default(0),
    zones: zod_1.z.array(exports.ZoneSchema).default([]),
    manager: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID')
        .optional(),
    isActive: zod_1.z.boolean().default(true),
});
/**
 * Update warehouse DTO
 */
exports.UpdateWarehouseSchema = exports.CreateWarehouseSchema.partial();
/**
 * Add zone DTO
 */
exports.AddZoneSchema = exports.ZoneSchema;
/**
 * Update zone DTO
 */
exports.UpdateZoneSchema = exports.ZoneSchema.partial();
/**
 * Query warehouses DTO
 */
exports.QueryWarehousesSchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .default('1')
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().min(1)),
    limit: zod_1.z
        .string()
        .optional()
        .default('10')
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().min(1).max(100)),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    isActive: zod_1.z
        .string()
        .optional()
        .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    manager: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID')
        .optional(),
    sortBy: zod_1.z
        .enum(['name', 'code', 'totalCapacity', 'usedCapacity', 'createdAt'])
        .optional()
        .default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
/**
 * Warehouse ID param
 */
exports.WarehouseIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
});
/**
 * Zone ID param
 */
exports.ZoneIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
    zoneId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid zone ID'),
});
