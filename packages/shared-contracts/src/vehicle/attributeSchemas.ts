import { z } from 'zod';
import {
  batteryRequiredFuelTypes,
  carBodyTypes,
  engineRequiredFuelTypes,
  fuelTypes,
  motorcycleTypes,
  transmissionTypes,
  vehicleConditions,
} from '../enums/index.js';

// Single source of truth for category attribute validation, reused by the backend's manual
// listing form and the worker's CSV pipeline so the conditional fuel-type rules can't drift
// between the two entry points.

const engineCapacityCc = z.coerce.number().int().positive().max(20_000).optional();
const batteryCapacityKWh = z.coerce.number().positive().max(1_000).optional();
const batteryRangeKm = z.coerce.number().positive().max(2_000).optional();
const mileageKm = z.coerce.number().finite().nonnegative();

const powertrainFields = { fuelType: z.enum(fuelTypes), transmission: z.enum(transmissionTypes), engineCapacityCc, batteryCapacityKWh, batteryRangeKm };

// Requires engineCapacityCc for combustion-bearing fuel types and both battery fields for
// battery-bearing fuel types (conventional hybrid is combustion-required but battery-optional).
function refinePowertrain(
  data: { fuelType: string; engineCapacityCc?: number; batteryCapacityKWh?: number; batteryRangeKm?: number },
  ctx: z.RefinementCtx,
) {
  const needsEngine = (engineRequiredFuelTypes as readonly string[]).includes(data.fuelType);
  const needsBattery = (batteryRequiredFuelTypes as readonly string[]).includes(data.fuelType);
  if (needsEngine && data.engineCapacityCc === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['engineCapacityCc'], message: `Engine capacity is required when fuel type is ${data.fuelType}.` });
  if (needsBattery && data.batteryCapacityKWh === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['batteryCapacityKWh'], message: `Battery capacity is required when fuel type is ${data.fuelType}.` });
  if (needsBattery && data.batteryRangeKm === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['batteryRangeKm'], message: `Battery range is required when fuel type is ${data.fuelType}.` });
}

export const carAttributesSchema = z.object({
  ...powertrainFields,
  edition: z.string().trim().max(80).optional(),
  bodyType: z.enum(carBodyTypes),
  condition: z.enum(vehicleConditions),
  mileageKm,
}).superRefine(refinePowertrain);

export const motorcycleAttributesSchema = z.object({
  ...powertrainFields,
  edition: z.string().trim().max(80).optional(),
  condition: z.enum(vehicleConditions),
  mileageKm,
  bikeType: z.enum(motorcycleTypes),
}).superRefine(refinePowertrain);

export const vanAttributesSchema = z.object({
  ...powertrainFields,
  edition: z.string().trim().max(80).optional(),
  condition: z.enum(vehicleConditions),
  mileageKm,
  seatingCapacity: z.coerce.number().int().positive().max(100).optional(),
}).superRefine(refinePowertrain);

export const truckAttributesSchema = z.object({
  ...powertrainFields,
  edition: z.string().trim().max(80).optional(),
  condition: z.enum(vehicleConditions),
  mileageKm,
  payloadCapacityKg: z.coerce.number().positive().max(100_000).optional(),
}).superRefine(refinePowertrain);

export const threeWheelerAttributesSchema = z.object({
  ...powertrainFields,
  condition: z.enum(vehicleConditions),
  mileageKm,
}).superRefine(refinePowertrain);

export const busAttributesSchema = z.object({
  ...powertrainFields,
  condition: z.enum(vehicleConditions),
  mileageKm,
  seatingCapacity: z.coerce.number().int().positive().max(200).optional(),
}).superRefine(refinePowertrain);

export const otherVehicleAttributesSchema = z.object({
  condition: z.enum(vehicleConditions).optional(),
  mileageKm: mileageKm.optional(),
});

// Discriminated on `category` so the backend/worker can validate one payload against the
// right attribute shape without a separate switch statement at every call site.
export const vehicleDetailsSchema = z.discriminatedUnion('category', [
  z.object({ category: z.literal('car'), attributes: carAttributesSchema }),
  z.object({ category: z.literal('motorcycle'), attributes: motorcycleAttributesSchema }),
  z.object({ category: z.literal('van'), attributes: vanAttributesSchema }),
  z.object({ category: z.literal('truck'), attributes: truckAttributesSchema }),
  z.object({ category: z.literal('three_wheeler'), attributes: threeWheelerAttributesSchema }),
  z.object({ category: z.literal('bus'), attributes: busAttributesSchema }),
  z.object({ category: z.literal('other'), attributes: otherVehicleAttributesSchema }),
]);

export type CarAttributesInput = z.infer<typeof carAttributesSchema>;
export type MotorcycleAttributesInput = z.infer<typeof motorcycleAttributesSchema>;
export type VanAttributesInput = z.infer<typeof vanAttributesSchema>;
export type TruckAttributesInput = z.infer<typeof truckAttributesSchema>;
export type ThreeWheelerAttributesInput = z.infer<typeof threeWheelerAttributesSchema>;
export type BusAttributesInput = z.infer<typeof busAttributesSchema>;
export type VehicleDetailsInput = z.infer<typeof vehicleDetailsSchema>;
