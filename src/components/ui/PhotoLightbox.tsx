'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  onNav: (index: number) => void;
}

export function PhotoLightbox({ images, index, onClose, onNav }: Props) {
  const prev = useCallback(() => onNav((index - 1 + images.length) % images.length), [index, images.length, onNav]);
  const next = useCallback(() => onNav((index + 1) % images.length), [index, images.length, onNav]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white/60 text-sm font-body">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main image + nav */}
      <div className="flex-1 flex items-center justify-center gap-3 px-3 min-h-0" onClick={e => e.stopPropagation()}>
        {/* Prev */}
        <button
          onClick={prev}
          disabled={images.length <= 1}
          className="shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-20"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center min-w-0 h-full">
          <img
            key={images[index]}
            src={images[index]}
            alt={`Photo ${index + 1}`}
            className="max-w-full max-h-full object-contain rounded-sm select-none"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
          />
        </div>

        {/* Next */}
        <button
          onClick={next}
          disabled={images.length <= 1}
          className="shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-20"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto" onClick={e => e.stopPropagation()}>
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => onNav(i)}
              className={`shrink-0 w-14 h-14 rounded-sm overflow-hidden border-2 transition-all ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
