import React, { useCallback, useRef, useState } from 'react';
import { LISTING_IMAGE_ASPECT_RATIO } from '@motorx/shared-contracts';

const FRAME_WIDTH = 480;
const FRAME_HEIGHT = Math.round(FRAME_WIDTH / LISTING_IMAGE_ASPECT_RATIO);
const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / LISTING_IMAGE_ASPECT_RATIO);

interface ImageCropModalProps {
  file: File;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}

// Fixed-ratio pan & zoom cropper: the image always fills the frame ("cover"), the dealer can only
// drag/zoom within it, so the exported crop can never show letterboxing or an off-ratio result.
export const ImageCropModal: React.FC<ImageCropModalProps> = ({ file, onCancel, onConfirm }) => {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

  const clampOffset = useCallback((x: number, y: number, currentScale: number, size: { width: number; height: number }) => {
    const displayedWidth = size.width * currentScale;
    const displayedHeight = size.height * currentScale;
    const maxX = Math.max(0, (displayedWidth - FRAME_WIDTH) / 2);
    const maxY = Math.max(0, (displayedHeight - FRAME_HEIGHT) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }, []);

  const handleImageLoad = () => {
    const img = imgRef.current!;
    const size = { width: img.naturalWidth, height: img.naturalHeight };
    const coverScale = Math.max(FRAME_WIDTH / size.width, FRAME_HEIGHT / size.height);
    setNaturalSize(size);
    setMinScale(coverScale);
    setScale(coverScale);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, startOffsetX: offset.x, startOffsetY: offset.y };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setOffset(clampOffset(dragState.current.startOffsetX + dx, dragState.current.startOffsetY + dy, scale, naturalSize));
  };

  const onPointerUp = () => { dragState.current = null; };

  const onScaleChange = (nextScale: number) => {
    setScale(nextScale);
    setOffset((prev) => clampOffset(prev.x, prev.y, nextScale, naturalSize));
  };

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const outputScale = OUTPUT_WIDTH / FRAME_WIDTH;
    const displayedWidth = naturalSize.width * scale;
    const displayedHeight = naturalSize.height * scale;
    const imageLeft = (FRAME_WIDTH - displayedWidth) / 2 + offset.x;
    const imageTop = (FRAME_HEIGHT - displayedHeight) / 2 + offset.y;
    ctx.drawImage(
      imgRef.current!,
      0, 0, naturalSize.width, naturalSize.height,
      imageLeft * outputScale, imageTop * outputScale, displayedWidth * outputScale, displayedHeight * outputScale,
    );
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(imageUrl);
      if (!blob) return;
      onConfirm(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  const handleCancel = () => {
    URL.revokeObjectURL(imageUrl);
    onCancel();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: FRAME_WIDTH + 48 }}>
        <div><strong>Crop image</strong><div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{file.name} — drag to reposition, use the slider to zoom</div></div>
        <div
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, overflow: 'hidden', position: 'relative', borderRadius: 'var(--radius-md)', background: '#000', cursor: 'grab', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            onLoad={handleImageLoad}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: naturalSize.width * scale,
              height: naturalSize.height * scale,
              maxWidth: 'none',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              userSelect: 'none',
            }}
          />
        </div>
        <label className="form-group">
          <span className="form-label">Zoom</span>
          <input type="range" min={minScale} max={minScale * 3} step={minScale / 100 || 0.01} value={scale} onChange={(e) => onScaleChange(Number(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>Skip this image</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>Use this crop</button>
        </div>
      </div>
    </div>
  );
};
