export type RejectedRow = { row: number; data: Record<string, string>; errors: string[] };
export function validate(row: Record<string, unknown>, rowNumber: number): RejectedRow | null {
	const text = (names: string[]) => String(names.map((name) => row[name]).find((value) => value !== undefined) ?? '').trim();
	const errors: string[] = [];
	if (!text(['make', 'Make'])) errors.push('Make is required');
	if (!text(['model', 'Model'])) errors.push('Model is required');
	const vin = text(['vin', 'VIN']);
	const plateNumber = text(['plateNumber', 'plate_number', 'plate', 'Plate Number']);
	if (!vin) errors.push('VIN is required');
	if (!plateNumber) errors.push('Plate number is required');
	if (!Number.isFinite(Number(text(['year', 'Year'])))) errors.push('Year must be a valid number');
	if (Number(text(['price', 'Price']).replace(/[$,]/g, '')) <= 0) errors.push('Price must be positive');
	return errors.length ? { row: rowNumber, data: Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? '')])), errors } : null;
}
