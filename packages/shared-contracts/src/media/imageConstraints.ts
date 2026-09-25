// Standard frame for every vehicle listing image (marketplace cards, detail gallery, dealer
// table thumbnails) — one ratio everywhere so `object-fit: cover` never crops inconsistently.
export const LISTING_IMAGE_ASPECT_RATIO = 5 / 3;
export const LISTING_IMAGE_ASPECT_RATIO_LABEL = '5:3';

export const LISTING_IMAGE_MIN_WIDTH_PX = 640;
export const LISTING_IMAGE_MIN_HEIGHT_PX = 384;

// Absorbs rounding drift from client-side canvas export without accepting an obviously
// mismatched (e.g. portrait) upload sent directly to the API.
export const LISTING_IMAGE_ASPECT_RATIO_TOLERANCE = 0.05;

// Server-side re-encoding limits applied to every uploaded listing photo (backend and worker).
// Images are decoded and saved again from their pixels only, which drops hidden trailing data
// and all metadata (EXIF GPS location, camera details). Anything larger than the pixel cap is
// refused before decoding, so a small "decompression bomb" file cannot exhaust memory.
export const LISTING_IMAGE_MAX_INPUT_PIXELS = 40_000_000;
export const LISTING_IMAGE_MAX_DIMENSION_PX = 2560;
export const LISTING_IMAGE_OUTPUT_QUALITY = 82;

// Storage prefix for listing photos (backend uploads, worker zip imports). Private objects such as
// dealer documents and inventory files use other prefixes, so a CDN can be limited to this one.
export const LISTING_IMAGE_OBJECT_PREFIX = 'listing-images/';
