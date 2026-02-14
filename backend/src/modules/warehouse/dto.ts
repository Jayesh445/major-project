import { z } from 'zod';

/**
 * Zone type enum
 */
export const ZoneTypeEnum = z.enum([
  'bulk',
  'fast_moving',
  'slow_moving',
  'fragile',
  'general',
]);

/**
 * Coordinates schema
 */
export const CoordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

/**
 * Location schema
 */
export const LocationSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters').trim(),
  city: z.string().min(2, 'City must be at least 2 characters').trim(),
  state: z.string().min(2, 'State must be at least 2 characters').trim(),
  country: z.string().default('India').trim(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .trim(),
  coordinates: CoordinatesSchema.optional(),
});

/**
 * Zone schema
 */
export const ZoneSchema = z.object({
  zoneCode: z
    .string()
    .min(1, 'Zone code is required')
    .max(10, 'Zone code cannot exceed 10 characters')
    .transform((val) => val.toUpperCase()),
  type: ZoneTypeEnum,
  capacityUnits: z
    .number()
    .min(0, 'Capacity units cannot be negative')
    .int('Capacity units must be an integer'),
  currentLoad: z
    .number()
    .min(0, 'Current load cannot be negative')
    .int('Current load must be an integer')
    .default(0),
});

/**
 * Create warehouse DTO
 */
export const CreateWarehouseSchema = z.object({
  name: z
    .string()
    .min(2, 'Warehouse name must be at least 2 characters')
    .max(100, 'Warehouse name cannot exceed 100 characters')
    .trim(),
  code: z
    .string()
    .min(3, 'Warehouse code must be at least 3 characters')
    .max(10, 'Warehouse code cannot exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Warehouse code must contain only uppercase letters and numbers')
    .transform((val) => val.toUpperCase()),
  location: LocationSchema,
  totalCapacity: z
    .number()
    .min(1, 'Total capacity must be at least 1')
    .int('Total capacity must be an integer'),
  usedCapacity: z
    .number()
    .min(0, 'Used capacity cannot be negative')
    .int('Used capacity must be an integer')
    .default(0),
  zones: z.array(ZoneSchema).default([]),
  manager: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID')
    .optional(),
  isActive: z.boolean().default(true),
});

/**
 * Update warehouse DTO
 */
export const UpdateWarehouseSchema = CreateWarehouseSchema.partial();

/**
 * Add zone DTO
 */
export const AddZoneSchema = ZoneSchema;

/**
 * Update zone DTO
 */
export const UpdateZoneSchema = ZoneSchema.partial();

/**
 * Query warehouses DTO
 */
export const QueryWarehousesSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  manager: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID')
    .optional(),
  sortBy: z
    .enum(['name', 'code', 'totalCapacity', 'usedCapacity', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Warehouse ID param
 */
export const WarehouseIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
});

/**
 * Zone ID param
 */
export const ZoneIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  zoneId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid zone ID'),
});

// Type exports
export type CreateWarehouseDto = z.infer<typeof CreateWarehouseSchema>;
export type UpdateWarehouseDto = z.infer<typeof UpdateWarehouseSchema>;
export type AddZoneDto = z.infer<typeof AddZoneSchema>;
export type UpdateZoneDto = z.infer<typeof UpdateZoneSchema>;
export type QueryWarehousesDto = z.infer<typeof QueryWarehousesSchema>;
export type WarehouseIdDto = z.infer<typeof WarehouseIdSchema>;
export type ZoneIdDto = z.infer<typeof ZoneIdSchema>;
