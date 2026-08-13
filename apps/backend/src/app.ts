import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authUserRouter } from './modules/auth-users/authUser.routes.js';
import { listingRouter } from './modules/marketplace/index.js';
import { adminDealerRouter, dealerRouter } from './modules/dealers/index.js';
import { errorHandler } from './shared/middleware/errorHandler.js';

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
  response.status(200).json({
    success: true,
    message: 'MotorX backend is alive.',
    data: { service: 'backend', status: 'UP' },
    meta: null,
  });
});

app.get('/health/ready', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'MotorX backend is ready.',
    data: { service: 'backend', status: 'READY' },
    meta: null,
  });
});

app.use('/api/v1/auth', authUserRouter);
app.use('/api/v1/listings', listingRouter);
app.use('/api/v1/dealers', dealerRouter);
app.use('/api/v1/admin/dealer-applications', adminDealerRouter);
app.use(errorHandler);
