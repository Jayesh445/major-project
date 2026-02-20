import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  
  description: z.string().optional(),
  
  category: z.string().min(1, 'Category is required'),
  
  unit: z.string().min(1, 'Unit is required'),
  
  unitPrice: z.number({ coerce: true })
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01'),
    
  reorderPoint: z.number({ coerce: true })
    .int('Must be an integer')
    .min(0, 'Cannot be negative'),
    
  safetyStock: z.number({ coerce: true })
    .int('Must be an integer')
    .min(0, 'Cannot be negative'),
    
  reorderQty: z.number({ coerce: true })
    .int('Must be an integer')
    .positive('Must be positive'),
    
  leadTimeDays: z.number({ coerce: true })
    .int('Must be an integer')
    .min(0, 'Cannot be negative'),
    
  primarySupplier: z.string().min(1, 'Primary supplier is required'),
  
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ProductInput = z.infer<typeof productSchema>;
