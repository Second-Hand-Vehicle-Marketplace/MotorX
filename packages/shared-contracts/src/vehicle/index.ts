import type {
  CarBodyType,
  FuelType,
  MotorcycleType,
  TransmissionType,
  VehicleCategory,
  VehicleCondition,
} from '../enums/index.js';

// Fields shared by every powertrain-bearing category (car/motorcycle/van/truck/three_wheeler/bus).
// Petrol/diesel/hybrid/plug_in_hybrid need engineCapacityCc; hybrid/plug_in_hybrid/electric need
// battery fields. Exact requiredness is enforced by the category Zod schemas, not by this type.
export interface PowertrainAttributes {
  fuelType: FuelType;
  transmission: TransmissionType;
  engineCapacityCc?: number;
  batteryCapacityKWh?: number;
  batteryRangeKm?: number;
}

export interface CarAttributes extends PowertrainAttributes {
  edition?: string;
  bodyType: CarBodyType;
  condition: VehicleCondition;
  mileageKm: number;
}

export interface MotorcycleAttributes extends PowertrainAttributes {
  edition?: string;
  condition: VehicleCondition;
  mileageKm: number;
  bikeType: MotorcycleType;
}

export interface VanAttributes extends PowertrainAttributes {
  edition?: string;
  condition: VehicleCondition;
  mileageKm: number;
  seatingCapacity?: number;
}

export interface TruckAttributes extends PowertrainAttributes {
  edition?: string;
  condition: VehicleCondition;
  mileageKm: number;
  payloadCapacityKg?: number;
}

export interface ThreeWheelerAttributes extends PowertrainAttributes {
  condition: VehicleCondition;
  mileageKm: number;
}

export interface BusAttributes extends PowertrainAttributes {
  condition: VehicleCondition;
  mileageKm: number;
  seatingCapacity?: number;
}

// A category with no dedicated attribute shape yet — kept intentionally minimal.
export interface OtherVehicleAttributes {
  condition?: VehicleCondition;
  mileageKm?: number;
}

// Discriminated union: the `category` field on a listing determines which attribute
// shape `attributes` must satisfy. Kept in sync with VehicleCategory in enums/index.ts.
export type VehicleDetails =
  | { category: Extract<VehicleCategory, 'car'>; attributes: CarAttributes }
  | { category: Extract<VehicleCategory, 'motorcycle'>; attributes: MotorcycleAttributes }
  | { category: Extract<VehicleCategory, 'van'>; attributes: VanAttributes }
  | { category: Extract<VehicleCategory, 'truck'>; attributes: TruckAttributes }
  | { category: Extract<VehicleCategory, 'three_wheeler'>; attributes: ThreeWheelerAttributes }
  | { category: Extract<VehicleCategory, 'bus'>; attributes: BusAttributes }
  | { category: Extract<VehicleCategory, 'other'>; attributes: OtherVehicleAttributes };

export type VehicleAttributesByCategory<C extends VehicleCategory> = Extract<VehicleDetails, { category: C }>['attributes'];

// A loose "any known attribute field, all optional" bag used for partial updates, where the
// listing's category (and therefore its exact attribute shape) is already fixed and not being changed.
export type AnyVehicleAttributes = Partial<
  CarAttributes & MotorcycleAttributes & VanAttributes & TruckAttributes & ThreeWheelerAttributes & BusAttributes & OtherVehicleAttributes
>;
