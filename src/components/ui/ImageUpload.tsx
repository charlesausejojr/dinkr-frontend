'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type UploadType = 'photo' | 'avatar';

interface ImageUploadProps {
  value: string;           // current image URL
  onChange: (url: string) => void;
  type?: UploadType;
  label?: string;
  className?: string;
}

const LIMITS: Record<UploadType, { min: number; max: number; label: string }> = {
  photo:  { min: 100,  max: 5120,  label: 'Min 100 KB · Max 5 MB' },
  avatar: { min: 30,   max: 3072,  label: 'Min 30 KB · Max 3 MB'  },
};

export function ImageUpload({
  value,
  onChange,
  type = 'photo',
  label,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const limits = LIMITS[type];

  const handleFile = async (file: File) => {
    setError('');

    // Client-side size check (bytes → KB)
    const kb = file.size / 1024;
    if (kb < limits.min) {
      setError(
        `Image is too small (${Math.round(kb)} KB). Please upload a higher-quality photo (min ${limits.min} KB).`
      );
      return;
    }
    if (kb > limits.max) {
      setError(
        `Image is too large (${(kb / 1024).toFixed(1)} MB). Maximum is ${limits.max / 1024} MB.`
      );
      return;
    }

    const form = new FormData();
    form.append('file', file);

    try {
      setUploading(true);
      const res = await api.post(`/upload/${type}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Prefix with API base so the URL works everywhere
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      onChange(`${base}${res.data.url}`);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {value ? (
        /* ── Preview ── */
        <div className={cn('relative group', type === 'avatar' ? 'w-32 h-32' : 'w-full')}>
          <img
            src={value}
            alt="Uploaded"
            className={cn(
              'w-full h-full object-cover border-2 border-gray-200',
              type === 'avatar' ? 'rounded-full h-32 w-32' : 'rounded-sm h-40'
            )}
          />
          <div className={cn(
            'absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40',
            type === 'avatar' ? 'rounded-full flex-col' : 'rounded-sm'
          )}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-court-green text-xs font-display font-bold uppercase rounded-sm"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-red-500 text-white rounded-sm"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300',
            'rounded-sm cursor-pointer transition-colors hover:border-court-green hover:bg-court-green/5',
            type === 'avatar' ? 'h-32 w-32 rounded-full' : 'h-36 w-full',
            uploading && 'opacity-60 cursor-wait'
          )}
        >
          {uploading ? (
            <span className="animate-spin text-court-green text-2xl">⟳</span>
          ) : (
            <>
              {type === 'avatar'
                ? <ImageIcon size={28} className="text-gray-300" />
                : <Upload size={24} className="text-gray-300" />
              }
              <span className="text-xs font-body text-gray-400 text-center px-2">
                {type === 'avatar' ? 'Upload photo' : 'Click or drag & drop'}
              </span>
            </>
          )}
        </div>
      )}

      <p className="text-xs font-body text-court-slate/40">
        JPEG, PNG, WebP or GIF · {limits.label}
      </p>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
