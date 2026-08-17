import React, { useState } from 'react';
import { LISTING_IMAGE_ASPECT_RATIO } from '@motorx/shared-contracts';
import type { VehicleImage } from '../types/listing.types';

const THUMBNAIL_WIDTH = 80;
const THUMBNAIL_HEIGHT = Math.round(THUMBNAIL_WIDTH / LISTING_IMAGE_ASPECT_RATIO);

interface ListingGalleryProps {
  images: VehicleImage[];
  title: string;
}

export const ListingGallery: React.FC<ListingGalleryProps> = ({ images, title }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: LISTING_IMAGE_ASPECT_RATIO,
        background: 'var(--color-bg-tertiary)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)'
      }}>
        No images available
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: LISTING_IMAGE_ASPECT_RATIO,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--color-glass-border)',
        background: 'var(--color-bg-secondary)',
      }}>
        <img
          src={currentImage.url}
          alt={currentImage.alt || title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {images.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'rgba(0,0,0,0.6)',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            backdropFilter: 'blur(8px)',
          }}>
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              style={{
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: idx === selectedIndex ? '2px solid var(--color-accent)' : '1px solid var(--color-glass-border)',
                opacity: idx === selectedIndex ? 1 : 0.6,
                transition: 'all 0.2s ease',
                flexShrink: 0,
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};