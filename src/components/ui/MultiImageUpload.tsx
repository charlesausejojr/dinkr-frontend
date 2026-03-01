'use client';

import { useRef, useState } from 'react';
import { Plus, X, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 8;
const MIN_KB = 100;
const MAX_KB = 5120; // 5 MB

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

export function MultiImageUpload({ value, onChange, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const canAddMore = value.length < MAX_PHOTOS;

  const handleFile = async (file: File) => {
    setError('');
    const kb = file.size / 1024;
    if (kb < MIN_KB) {
      setError(`Too small (${Math.round(kb)} KB). Min ${MIN_KB} KB.`);
      return;
    }
    if (kb > MAX_KB) {
      setError(`Too large (${(kb / 1024).toFixed(1)} MB). Max ${MAX_KB / 1024} MB.`);
      return;
    }

    const form = new FormData();
    form.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange([...value, res.data.url]);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected after removal
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">
            {label}
          </label>
          <span className="text-xs font-body text-court-slate/40">
            {value.length} / {MAX_PHOTOS} photos
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className="grid grid-cols-4 gap-2">
        {/* Existing photos */}
        {value.map((url, idx) => (
          <div key={url} className="relative group aspect-square rounded-sm overflow-hidden border-2 border-gray-200">
            <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
            {/* Overlay with remove button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-1.5 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            {/* Cover badge */}
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-display font-bold uppercase rounded leading-none">
                Cover
              </span>
            )}
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'aspect-square rounded-sm border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1',
              'hover:border-court-green hover:bg-court-green/5 transition-colors',
              uploading && 'opacity-60 cursor-wait'
            )}
          >
            {uploading ? (
              <span className="animate-spin text-court-green text-xl">⟳</span>
            ) : (
              <>
                <Plus size={18} className="text-gray-400" />
                <span className="text-[10px] font-body text-gray-400">Add</span>
              </>
            )}
          </button>
        )}

        {/* Empty state when no photos */}
        {value.length === 0 && !uploading && (
          <div className="col-span-4 flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-200 rounded-sm bg-gray-50">
            <ImageIcon size={24} className="text-gray-300" />
            <span className="text-xs font-body text-gray-400">Click Add to upload photos</span>
          </div>
        )}
      </div>

      <p className="text-xs font-body text-court-slate/40">
        JPEG, PNG or WebP · Min 100 KB · Max 5 MB per photo · Up to {MAX_PHOTOS} photos
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
