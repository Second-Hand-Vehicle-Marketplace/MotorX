export const generateEmbedding = async (text: string): Promise<number[]> => {
	const values = new Array<number>(32).fill(0);
	for (const [index, character] of [...text].entries()) values[index % values.length] += character.charCodeAt(0) / 255;
	const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
	return values.map((value) => value / magnitude);
};
