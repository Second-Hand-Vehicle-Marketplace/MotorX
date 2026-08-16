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

// One entry per trigger in the notification delivery strategy — drives both the message copy
// and which channels a notification is sent on.
export const notificationTypes = [
  'upload_completed',
  'upload_completed_with_errors',
  'upload_failed',
  'image_processing_completed',
  'image_processing_completed_with_errors',
  'image_processing_failed',
  'dealer_application_submitted',
  'dealer_application_approved',
  'dealer_application_rejected',
  'upload_high_rejection_rate',
  'listing_removed',
  'account_suspended',
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notificationChannels = ['in_app', 'email'] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

// 'not_applicable' when the notification has no email channel at all.
export const notificationEmailStatuses = ['not_applicable', 'pending', 'sent', 'failed'] as const;
export type NotificationEmailStatus = (typeof notificationEmailStatuses)[number];

// Lifecycle of a vehicle listing. Not every transition is legal — see
// `allowedTransitions` in listing.service.ts for which moves are permitted.
export const listingStatuses = ['draft', 'active', 'sold', 'archived'] as const;
export type ListingStatus = (typeof listingStatuses)[number];

export const fuelTypes = ['petrol', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric', 'other'] as const;
export type FuelType = (typeof fuelTypes)[number];

// Fuel types with a combustion engine — these require engineCapacityCc.
export const engineRequiredFuelTypes = ['petrol', 'diesel', 'hybrid', 'plug_in_hybrid'] as const;
// Fuel types with a traction battery — these require batteryCapacityKWh and batteryRangeKm.
// (Conventional hybrid deliberately excluded: battery specs are optional for a regular hybrid.)
export const batteryRequiredFuelTypes = ['electric', 'plug_in_hybrid'] as const;

export const transmissionTypes = ['automatic', 'manual', 'cvt', 'dct', 'one_speed_automatic', 'other'] as const;
export type TransmissionType = (typeof transmissionTypes)[number];

// Top-level vehicle type. Determines which VehicleAttributes shape a listing carries.
export const vehicleCategories = ['car', 'motorcycle', 'van', 'truck', 'three_wheeler', 'bus', 'other'] as const;
export type VehicleCategory = (typeof vehicleCategories)[number];

// Second-hand marketplace condition — not a full 1-10 grading scale, kept simple and filterable.
export const vehicleConditions = ['used', 'reconditioned', 'brand_new'] as const;
export type VehicleCondition = (typeof vehicleConditions)[number];

export const carBodyTypes = ['sedan', 'hatchback', 'suv', 'crossover', 'coupe', 'convertible', 'wagon', 'pickup', 'minivan', 'other'] as const;
export type CarBodyType = (typeof carBodyTypes)[number];

export const motorcycleTypes = ['scooter', 'standard', 'sport', 'cruiser', 'touring', 'dual_sport', 'off_road', 'other'] as const;
export type MotorcycleType = (typeof motorcycleTypes)[number];
