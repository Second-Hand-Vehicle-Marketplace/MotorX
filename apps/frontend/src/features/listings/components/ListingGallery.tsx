import React, { useRef, useState } from 'react';
import { LISTING_IMAGE_ASPECT_RATIO } from '@motorx/shared-contracts';
import type { VehicleImage } from '../types/listing.types';
import { useI18n } from '../../../shared/i18n/useI18n';
import { ListingPhoto } from './ListingPhoto';

const THUMBNAIL_WIDTH = 80;
const THUMBNAIL_HEIGHT = Math.round(THUMBNAIL_WIDTH / LISTING_IMAGE_ASPECT_RATIO);
// A horizontal finger movement longer than this (in CSS pixels) changes the photo.
const SWIPE_DISTANCE = 40;
// The main photo fills the width on phones and tablets, and two thirds of a 1280 px page above that.
const MAIN_IMAGE_SIZES = '(max-width: 1024px) 100vw, 850px';

interface ListingGalleryProps {
  images: VehicleImage[];
  title: string;
}

export const ListingGallery: React.FC<ListingGalleryProps> = ({ images, title }) => {
  const { t } = useI18n();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="gallery-empty" style={{ aspectRatio: LISTING_IMAGE_ASPECT_RATIO }}>
        {t('gallery.none')}
      </div>
    );
  }

  const count = images.length;
  const index = Math.min(selectedIndex, count - 1);
  const currentImage = images[index]!;
  const show = (next: number) => setSelectedIndex((next + count) % count);

  const onTouchStart = (event: React.TouchEvent) => { const touch = event.touches[0]!; touchStart.current = { x: touch.clientX, y: touch.clientY }; };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current; touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x; const dy = touch.clientY - start.y;
    // Mostly-vertical movements are the page scrolling, not a swipe.
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy)) return;
    show(index + (dx < 0 ? 1 : -1));
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
  };

  return (
    <div className="listing-gallery">
      <div
        className="gallery-main"
        style={{ aspectRatio: LISTING_IMAGE_ASPECT_RATIO }}
        onTouchStart={count > 1 ? onTouchStart : undefined}
        onTouchEnd={count > 1 ? onTouchEnd : undefined}
        onKeyDown={count > 1 ? onKeyDown : undefined}
        tabIndex={count > 1 ? 0 : undefined}
        role={count > 1 ? 'region' : undefined}
        aria-roledescription={count > 1 ? 'carousel' : undefined}
        aria-label={title}
      >
        {/* key: a new <img> per photo, so the previous photo is never shown under the new one's alt text */}
        <ListingPhoto key={currentImage.id} image={currentImage} alt={currentImage.alt || title} sizes={MAIN_IMAGE_SIZES} priority={index === 0} />
        {count > 1 && (
          <>
            <button type="button" className="gallery-arrow gallery-arrow-prev" aria-label={t('gallery.previous')} onClick={() => show(index - 1)}>‹</button>
            <button type="button" className="gallery-arrow gallery-arrow-next" aria-label={t('gallery.next')} onClick={() => show(index + 1)}>›</button>
            <div className="gallery-counter" aria-live="polite">{t('gallery.position', { index: index + 1, total: count })}</div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="gallery-thumbnails">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              aria-label={t('gallery.show', { index: idx + 1 })}
              aria-current={idx === index ? 'true' : undefined}
              className={`gallery-thumbnail ${idx === index ? 'is-selected' : ''}`}
              style={{ width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT }}
            >
              <ListingPhoto image={img} alt="" sizes={`${THUMBNAIL_WIDTH}px`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
