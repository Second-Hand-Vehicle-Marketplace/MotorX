import { vehicleCategories, type FuelType, type VehicleCategory } from '@motorx/shared-contracts';

export const buyerVehicleMakes = ['Audi', 'BMW', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen'];
export const buyerFuelTypes: FuelType[] = ['petrol', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric', 'other'];
export const buyerVehicleCategories: VehicleCategory[] = vehicleCategories.filter((category) => category !== 'other');
