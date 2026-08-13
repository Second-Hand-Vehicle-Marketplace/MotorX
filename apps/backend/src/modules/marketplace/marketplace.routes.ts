import { Router } from 'express';
import { createListing, getListingById, getListings, createInquiry, updateListing } from './marketplace.controller.js';

export const marketplaceRouter = Router();

marketplaceRouter.get('/', getListings);
marketplaceRouter.get('/:id', getListingById);
marketplaceRouter.post('/', createListing);
marketplaceRouter.put('/:id', updateListing);
marketplaceRouter.post('/:id/inquiries', createInquiry);
