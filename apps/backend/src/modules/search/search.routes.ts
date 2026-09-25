import { Router } from 'express';
import { searchLimiter } from '../../shared/middleware/rateLimits.js';
import { validateRequest } from '../../shared/middleware/validateRequest.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { getSearchResults } from './search.controller.js';
import { searchQuerySchema } from './search.validation.js';

export const searchRouter = Router();
searchRouter.get('/', searchLimiter, validateRequest({ query: searchQuerySchema }), asyncHandler(getSearchResults));
