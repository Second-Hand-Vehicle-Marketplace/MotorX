// Standard frame for every vehicle listing image (marketplace cards, detail gallery, dealer
// table thumbnails) — one ratio everywhere so `object-fit: cover` never crops inconsistently.
export const LISTING_IMAGE_ASPECT_RATIO = 5 / 3;
export const LISTING_IMAGE_ASPECT_RATIO_LABEL = '5:3';

export const LISTING_IMAGE_MIN_WIDTH_PX = 640;
export const LISTING_IMAGE_MIN_HEIGHT_PX = 384;

// Absorbs rounding drift from client-side canvas export without accepting an obviously
// mismatched (e.g. portrait) upload sent directly to the API.
export const LISTING_IMAGE_ASPECT_RATIO_TOLERANCE = 0.05;
