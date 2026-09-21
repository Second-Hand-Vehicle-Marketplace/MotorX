import mongoose from 'mongoose';
import { env } from './env.js';

// Opens the worker's independent MongoDB connection before queue consumption.
export async function connectWorkerDatabase() { await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 }); }

// Closes MongoDB after the BullMQ consumer stops accepting work.
export async function disconnectWorkerDatabase() { await mongoose.disconnect(); }
