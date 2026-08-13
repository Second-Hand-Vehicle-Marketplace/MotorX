// Single source of truth for every fixed set of values shared between backend and frontend.
// Each pair is: the array of allowed values (used at runtime by Mongoose enums and Zod z.enum())
// plus the TypeScript union type derived from it (`(typeof x)[number]`), so the two can never drift apart.

// Every account starts as 'buyer'; becomes 'dealer' only once an admin approves a dealer application.
export const userRoles = ['buyer', 'dealer', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

// 'suspended' accounts keep their role but are blocked by requireAuthenticated.
export const userStatuses = ['active', 'pending', 'suspended'] as const;
export type UserStatus = (typeof userStatuses)[number];

// Lifecycle of a single dealer application: starts 'pending', ends 'approved' or 'rejected'.
export const dealerApplicationStatuses = ['pending', 'approved', 'rejected'] as const;
export type DealerApplicationStatus = (typeof dealerApplicationStatuses)[number];

// Lifecycle of a vehicle listing. Not every transition is legal — see
// `allowedTransitions` in listing.service.ts for which moves are permitted.
export const listingStatuses = ['draft', 'active', 'sold', 'archived'] as const;
export type ListingStatus = (typeof listingStatuses)[number];

export const fuelTypes = ['petrol', 'diesel', 'hybrid', 'electric', 'other'] as const;
export type FuelType = (typeof fuelTypes)[number];

export const transmissionTypes = ['automatic', 'manual', 'other'] as const;
export type TransmissionType = (typeof transmissionTypes)[number];
