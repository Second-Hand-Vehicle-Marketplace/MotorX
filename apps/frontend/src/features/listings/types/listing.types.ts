import type {
  ApiSuccessResponse,
  CreateListingInput as SharedCreateListingInput,
  ListingDto,
  ListingImageDto,
  PaginationMeta,
  UpdateListingInput as SharedUpdateListingInput,
  UpdateListingStatusInput as SharedUpdateListingStatusInput,
  ReorderListingImagesInput as SharedReorderListingImagesInput,
} from '@motorx/shared-contracts';

export type ListingImage = ListingImageDto;
export type Listing = ListingDto;
export type CreateListingInput = SharedCreateListingInput;
export type ListingPagination = PaginationMeta;
export type ListingsResponse = ApiSuccessResponse<Listing[], { pagination: ListingPagination }>;
export type UpdateListingInput = SharedUpdateListingInput;
export type UpdateListingStatusInput = SharedUpdateListingStatusInput;
export type ReorderListingImagesInput = SharedReorderListingImagesInput;
