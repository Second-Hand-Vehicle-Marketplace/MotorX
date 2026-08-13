import { Router } from 'express';
import { dealerService } from '../dealers/dealer.service.js';
import { ListingModel } from '../listings/listing.model.js';

const buildSearchableRecords = async () => {
  const listingDocuments = await ListingModel.find({ status: { $nin: ['hidden', 'archived'] } }).lean();
  const listingRecords = listingDocuments.map((listing) => ({
    id: String(listing._id),
    type: 'listing',
    title: listing.title,
    subtitle: listing.dealerName,
    match: `${listing.make} ${listing.model} ${listing.dealerName} ${listing.status} ${listing.year}`,
  }));

  const dealerApplications = await dealerService.listApplications();
  const dealerRecords = dealerApplications.map((application) => ({
    id: application.id,
    type: 'dealer',
    title: application.businessName,
    subtitle: `Dealer ${application.status}`,
    match: `${application.businessName} ${application.applicantName} ${application.email} ${application.status}`,
  }));

  return [...listingRecords, ...dealerRecords];
};

export const searchRouter = Router();

searchRouter.get('/', async (request, response) => {
  const query = String(request.query.q ?? '').trim().toLowerCase();
  const searchableRecords = await buildSearchableRecords();

  const results = !query
    ? searchableRecords
    : searchableRecords.filter((record) => record.match.toLowerCase().includes(query));

  response.status(200).json({
    success: true,
    message: 'Search results retrieved successfully.',
    data: results,
    meta: null,
  });
});
