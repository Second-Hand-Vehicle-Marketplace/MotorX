import type { VehicleCategory } from '../enums/index.js';

export interface CsvFieldDescriptor {
  key: string;
  label: string;
  /** Human-readable requiredness shown in the on-page field guide (e.g. "Yes", "Electric only"). */
  required: string;
  example: string;
}

export interface CategoryCsvTemplate {
  category: VehicleCategory;
  label: string;
  fields: CsvFieldDescriptor[];
  exampleRows: Record<string, string>[];
}

// Columns every category's CSV template starts with — kept in one place so a change to the
// common listing fields (e.g. a new required field) only has to be made here, not per-category.
const commonFields: CsvFieldDescriptor[] = [
  { key: 'registrationNumber', label: 'Registration Number', required: 'Yes', example: 'CAX-1234' },
  { key: 'title', label: 'Title', required: 'Yes', example: 'Toyota Corolla 2020' },
  { key: 'make', label: 'Make', required: 'Yes', example: 'Toyota' },
  { key: 'model', label: 'Model', required: 'Yes', example: 'Corolla' },
  { key: 'year', label: 'Year of Manufacture', required: 'Yes', example: '2020' },
  { key: 'price', label: 'Price', required: 'Yes', example: '8500000' },
  { key: 'currency', label: 'Currency', required: 'No (defaults to LKR)', example: 'LKR' },
  { key: 'location', label: 'Location', required: 'Yes', example: 'Colombo' },
  { key: 'description', label: 'Description', required: 'No', example: 'Well maintained' },
];

const editionField: CsvFieldDescriptor = { key: 'edition', label: 'Edition', required: 'No', example: 'G' };
const conditionField: CsvFieldDescriptor = { key: 'condition', label: 'Condition', required: 'Yes (used / reconditioned / brand_new)', example: 'used' };
const mileageField: CsvFieldDescriptor = { key: 'mileageKm', label: 'Mileage (km)', required: 'Yes', example: '45000' };
const fuelTypeField: CsvFieldDescriptor = { key: 'fuelType', label: 'Fuel Type', required: 'Yes (petrol / diesel / hybrid / plug_in_hybrid / electric)', example: 'petrol' };
const transmissionField: CsvFieldDescriptor = { key: 'transmission', label: 'Transmission', required: 'Yes (manual / automatic / cvt / dct / one_speed_automatic)', example: 'automatic' };
const engineCapacityField: CsvFieldDescriptor = { key: 'engineCapacityCc', label: 'Engine Capacity (cc)', required: 'Petrol / Diesel / Hybrid / Plug-in Hybrid', example: '1800' };
const batteryCapacityField: CsvFieldDescriptor = { key: 'batteryCapacityKWh', label: 'Battery Capacity (kWh)', required: 'Electric / Plug-in Hybrid', example: '' };
const batteryRangeField: CsvFieldDescriptor = { key: 'batteryRangeKm', label: 'Battery Range (km)', required: 'Electric / Plug-in Hybrid', example: '' };

const powertrainFields = [fuelTypeField, transmissionField, engineCapacityField, batteryCapacityField, batteryRangeField];

export const carCsvTemplate: CategoryCsvTemplate = {
  category: 'car', label: 'Car',
  fields: [...commonFields, editionField, { key: 'bodyType', label: 'Body Type', required: 'Yes (sedan / hatchback / suv / crossover / coupe / convertible / wagon / pickup / minivan)', example: 'sedan' }, conditionField, mileageField, ...powertrainFields],
  exampleRows: [
    { registrationNumber: 'CAX-1234', title: 'Toyota Corolla 2020', make: 'Toyota', model: 'Corolla', edition: 'G', bodyType: 'sedan', year: '2020', condition: 'used', price: '8500000', currency: 'LKR', mileageKm: '45000', fuelType: 'petrol', transmission: 'automatic', engineCapacityCc: '1800', batteryCapacityKWh: '', batteryRangeKm: '', location: 'Colombo', description: 'Well maintained' },
    { registrationNumber: 'CAE-5678', title: 'Nissan Leaf 2022', make: 'Nissan', model: 'Leaf', edition: 'G', bodyType: 'hatchback', year: '2022', condition: 'used', price: '12500000', currency: 'LKR', mileageKm: '32000', fuelType: 'electric', transmission: 'one_speed_automatic', engineCapacityCc: '', batteryCapacityKWh: '40', batteryRangeKm: '270', location: 'Colombo', description: 'Good condition' },
  ],
};

export const motorcycleCsvTemplate: CategoryCsvTemplate = {
  category: 'motorcycle', label: 'Motorcycle',
  fields: [...commonFields, editionField, conditionField, mileageField, ...powertrainFields, { key: 'bikeType', label: 'Bike Type', required: 'Yes (scooter / standard / sport / cruiser / touring / dual_sport / off_road)', example: 'standard' }],
  exampleRows: [
    { registrationNumber: 'BAX-1122', title: 'Honda CB125F 2021', make: 'Honda', model: 'CB125F', edition: '', year: '2021', condition: 'used', price: '650000', currency: 'LKR', mileageKm: '8000', fuelType: 'petrol', transmission: 'manual', engineCapacityCc: '125', batteryCapacityKWh: '', batteryRangeKm: '', bikeType: 'standard', location: 'Kandy', description: 'Daily commuter, well serviced' },
  ],
};

export const vanCsvTemplate: CategoryCsvTemplate = {
  category: 'van', label: 'Van',
  fields: [...commonFields, editionField, conditionField, mileageField, ...powertrainFields, { key: 'seatingCapacity', label: 'Seating Capacity', required: 'No', example: '8' }],
  exampleRows: [
    { registrationNumber: 'VAX-3344', title: 'Toyota HiAce 2018', make: 'Toyota', model: 'HiAce', edition: '', year: '2018', condition: 'used', price: '9500000', currency: 'LKR', mileageKm: '120000', fuelType: 'diesel', transmission: 'manual', engineCapacityCc: '2700', batteryCapacityKWh: '', batteryRangeKm: '', seatingCapacity: '15', location: 'Galle', description: 'School van, well maintained' },
  ],
};

export const truckCsvTemplate: CategoryCsvTemplate = {
  category: 'truck', label: 'Truck',
  fields: [...commonFields, editionField, conditionField, mileageField, ...powertrainFields, { key: 'payloadCapacityKg', label: 'Payload Capacity (kg)', required: 'No', example: '3000' }],
  exampleRows: [
    { registrationNumber: 'TAX-5566', title: 'Isuzu Elf 2015', make: 'Isuzu', model: 'Elf', edition: '', year: '2015', condition: 'used', price: '6800000', currency: 'LKR', mileageKm: '210000', fuelType: 'diesel', transmission: 'manual', engineCapacityCc: '4000', batteryCapacityKWh: '', batteryRangeKm: '', payloadCapacityKg: '3000', location: 'Kurunegala', description: 'Well maintained, single owner' },
  ],
};

export const threeWheelerCsvTemplate: CategoryCsvTemplate = {
  category: 'three_wheeler', label: 'Three-Wheeler',
  fields: [...commonFields, conditionField, mileageField, ...powertrainFields],
  exampleRows: [
    { registrationNumber: 'WAX-7788', title: 'Bajaj RE 2019', make: 'Bajaj', model: 'RE', year: '2019', condition: 'used', price: '950000', currency: 'LKR', mileageKm: '55000', fuelType: 'petrol', transmission: 'manual', engineCapacityCc: '200', batteryCapacityKWh: '', batteryRangeKm: '', location: 'Negombo', description: 'Good running condition' },
  ],
};

export const busCsvTemplate: CategoryCsvTemplate = {
  category: 'bus', label: 'Bus',
  fields: [...commonFields, conditionField, mileageField, ...powertrainFields, { key: 'seatingCapacity', label: 'Seating Capacity', required: 'No', example: '52' }],
  exampleRows: [
    { registrationNumber: 'NAX-9900', title: 'Ashok Leyland 2016', make: 'Ashok Leyland', model: 'Viking', year: '2016', condition: 'used', price: '14500000', currency: 'LKR', mileageKm: '350000', fuelType: 'diesel', transmission: 'manual', engineCapacityCc: '5700', batteryCapacityKWh: '', batteryRangeKm: '', seatingCapacity: '52', location: 'Kurunegala', description: 'School bus, recently serviced' },
  ],
};

export const csvTemplatesByCategory: Partial<Record<VehicleCategory, CategoryCsvTemplate>> = {
  car: carCsvTemplate, motorcycle: motorcycleCsvTemplate, van: vanCsvTemplate,
  truck: truckCsvTemplate, three_wheeler: threeWheelerCsvTemplate, bus: busCsvTemplate,
};

// Renders a template's field list + example rows into an actual downloadable CSV file body.
export function buildCsvTemplateContent(template: CategoryCsvTemplate): string {
  const headers = template.fields.map((field) => field.key);
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const lines = [headers.join(','), ...template.exampleRows.map((row) => headers.map((key) => escape(row[key] ?? '')).join(','))];
  return lines.join('\n') + '\n';
}
