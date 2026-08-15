import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { authUserRouter } from './modules/auth-users/authUser.routes.js';
import { listingImageRouter, listingRouter } from './modules/marketplace/index.js';
import { dealerRouter } from './modules/dealers/index.js';
import { adminRouter } from './modules/admin/index.js';
import { buyerRouter } from './modules/buyers/index.js';
import { inventoryRouter } from './modules/inventory/index.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { sendSuccess } from './shared/responses/apiResponse.js';

export const app = express();

// The frontend and backend are intentionally different origins (separate SPA + API deployment,
// e.g. localhost:8080 vs localhost:3000 in dev). Helmet's default same-origin resource policy
// blocks the browser from rendering anything the backend serves — most visibly, every <img>
// pointed at /api/v1/listing-images — so it's relaxed here to match how this app is actually deployed.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
// listingRouter must mount before buyerRouter: buyerRouter's public GET /:listingId
// would otherwise shadow listingRouter's GET /mine (matching "mine" as a listing id).
app.use('/api/v1/listings', listingRouter);
app.use('/api/v1/listings', buyerRouter);
app.use('/api/v1/listing-images', listingImageRouter);
app.use('/api/v1/dealers', dealerRouter);
app.use('/api/v1/dealer/uploads', inventoryRouter);
app.use('/api/v1/admin', adminRouter);
app.use(errorHandler);
