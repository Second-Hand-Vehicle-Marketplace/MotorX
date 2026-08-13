import { z } from 'zod';

export const createListingSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900, 'Year must be after 1900').max(new Date().getFullYear() + 1),
  price: z.number().min(0, 'Price must be positive'),
  mileage: z.number().min(0, 'Mileage must be positive'),
  bodyType: z.enum(['sedan', 'suv', 'hatchback', 'coupe', 'truck', 'van', 'wagon', 'convertible']),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'plug-in-hybrid']),
  transmission: z.enum(['automatic', 'manual', 'cvt']),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  color: z.string().min(1, 'Color is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  vin: z.string().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;