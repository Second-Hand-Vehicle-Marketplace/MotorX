export const detectDuplicates = (identifiers: string[], fingerprint: string, seen: Set<string>) => {
	const keys = identifiers.map((identifier) => identifier.trim().toLowerCase()).filter(Boolean);
	if (!keys.length) keys.push(fingerprint.trim().toLowerCase());
	if (!keys.length || keys.some((key) => seen.has(key))) return true;
	keys.forEach((key) => seen.add(key));
	return false;
};
