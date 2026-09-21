import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/responses/apiResponse.js';
import { searchListings } from './search.service.js';
import type { SearchQuery } from './search.validation.js';

export async function getSearchResults(request: Request, response: Response) {
  sendSuccess(response, await searchListings(request.query as unknown as SearchQuery));
}
