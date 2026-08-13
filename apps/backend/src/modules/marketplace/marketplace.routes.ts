import { Router } from 'express';
import multer from 'multer';
import { createListing, getListingById, getListings, createInquiry, updateListing } from './marketplace.controller.js';

const listingImages = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
});

export const marketplaceRouter = Router();

marketplaceRouter.get('/', getListings);
marketplaceRouter.get('/:id', getListingById);
marketplaceRouter.post('/', listingImages.array('images', 10), createListing);
marketplaceRouter.put('/:id', updateListing);
marketplaceRouter.post('/:id/inquiries', createInquiry);
