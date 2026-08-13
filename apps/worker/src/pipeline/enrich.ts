export const enrich = (row: Record<string, unknown>, make: string, model: string, year: number) => ({
	title: String(row.title ?? '').trim() || `${year} ${make} ${model}`,
	description: String(row.description ?? '').trim(),
});
