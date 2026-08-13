import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authUserRouter } from './modules/auth-users/authUser.routes.js';
import { listingImageRouter, listingRouter } from './modules/marketplace/index.js';
import { adminDealerRouter, dealerRouter } from './modules/dealers/index.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { sendSuccess } from './shared/responses/apiResponse.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  }),
);
app.use(express.json());
app.disable('x-powered-by');

app.get('/health/live', (_request, response) => {
  sendSuccess(response, { service: 'backend', status: 'UP' });
});

app.get('/health/ready', (_request, response) => {
  sendSuccess(response, { service: 'backend', status: 'READY' });
});

app.use('/api/v1/auth', authUserRouter);
app.use('/api/v1/listings', listingRouter);
app.use('/api/v1/listing-images', listingImageRouter);
app.use('/api/v1/dealers', dealerRouter);
app.use('/api/v1/admin/dealer-applications', adminDealerRouter);
app.use(errorHandler);
