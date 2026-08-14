export const persist = async (model: { create: (data: unknown) => Promise<unknown> }, data: unknown) => model.create(data);
