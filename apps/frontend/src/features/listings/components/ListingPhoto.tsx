import React from 'react';
import { LISTING_IMAGE_MAX_DIMENSION_PX, LISTING_IMAGE_THUMB_MAX_DIMENSION_PX } from '@motorx/shared-contracts';
import type { VehicleImage } from '../types/listing.types';

interface ListingPhotoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt'> {
  image: VehicleImage;
  alt: string;
  // How wide the photo is drawn, so the browser can pick the small or full copy (e.g. "100vw").
  sizes: string;
  // Photos visible straight away (the gallery's first photo) load at once; others wait until scrolled near.
  priority?: boolean;
}

// A listing photo that lets the browser choose the right size: the 800 px copy on phones and in
// cards, the full photo only where it is drawn large on a wide or high-density screen.
export const ListingPhoto: React.FC<ListingPhotoProps> = ({ image, alt, sizes, priority = false, ...imgProps }) => (
  <img
    {...imgProps}
    src={image.thumbUrl ?? image.url}
    srcSet={image.thumbUrl ? `${image.thumbUrl} ${LISTING_IMAGE_THUMB_MAX_DIMENSION_PX}w, ${image.url} ${LISTING_IMAGE_MAX_DIMENSION_PX}w` : undefined}
    sizes={image.thumbUrl ? sizes : undefined}
    alt={alt}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
  />
);
