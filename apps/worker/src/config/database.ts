import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
	while (true) {
		try {
			await mongoose.connect(env.MONGODB_URI, {
				dbName: 'motorx',
				serverSelectionTimeoutMS: 20000,
				connectTimeoutMS: 20000,
			});
			console.log('Worker connected to MongoDB.');
			return;
		} catch (error) {
			console.error('Worker MongoDB connection failed; retrying in 5 seconds:', error instanceof Error ? error.message : error);
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}
}

export async function disconnectDatabase(): Promise<void> {
	await mongoose.disconnect();
}
