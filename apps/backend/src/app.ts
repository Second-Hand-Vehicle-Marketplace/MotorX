import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authUsersRouter } from './modules/auth-users/auth-user.routes.js';
import { marketplaceRouter } from './modules/marketplace/marketplace.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { dealerRoutes } from './modules/dealers/dealer.routes.js';
import { notificationsRouter } from './modules/notifications/index.js';
import { searchRouter } from './modules/search/index.js';
import { uploadRouter } from './modules/inventory/upload.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '20mb' }));

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

app.use('/api/v1/auth', authUsersRouter);
app.use('/api/v1/listings', marketplaceRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/dealer', dealerRoutes);
app.use('/api/v1/dealer/listings', marketplaceRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/uploads', uploadRouter);
app.use('/api/v1/dealer/uploads', uploadRouter);
