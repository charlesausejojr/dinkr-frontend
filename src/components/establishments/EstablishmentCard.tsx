'use client';

import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Establishment } from '@/types';

interface Props {
  establishment: Establishment;
  onSelect: (est: Establishment) => void;
  selected: boolean;
}

export function EstablishmentCard({ establishment, onSelect, selected }: Props) {
  const courtCount = establishment.courts?.length ?? 0;
  const visibleAmenities = establishment.amenities.slice(0, 3);
  const extraAmenities = establishment.amenities.length - 3;

  return (
    <div
      className={cn(
        'bg-white rounded-sm border-2 p-5 flex flex-col gap-4 transition-all duration-150',
        selected
          ? 'border-court-lime bg-court-green/5'
          : 'border-gray-200 hover:border-court-green/30'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-court-green leading-tight">
          {establishment.name}
        </h3>
        {courtCount > 0 && (
          <span className="shrink-0 px-2 py-0.5 bg-court-lime text-court-green text-xs font-display font-bold uppercase rounded-full">
            {courtCount} {courtCount === 1 ? 'court' : 'courts'}
          </span>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-court-slate/70 text-sm">
        <MapPin size={14} className="shrink-0" />
        <span className="font-body">{establishment.location}</span>
      </div>

      {/* Description */}
      {establishment.description && (
        <p className="text-sm font-body text-court-slate/60 line-clamp-2">
          {establishment.description}
        </p>
      )}

      {/* Amenities */}
      {visibleAmenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleAmenities.map((a) => (
            <span
              key={a}
              className="px-2 py-0.5 bg-gray-100 text-court-slate text-xs font-body rounded-full"
            >
              {a}
            </span>
          ))}
          {extraAmenities > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-court-slate/50 text-xs font-body rounded-full">
              +{extraAmenities} more
            </span>
          )}
        </div>
      )}

      <Button
        variant={selected ? 'secondary' : 'primary'}
        size="sm"
        className="w-full mt-auto"
        onClick={() => onSelect(establishment)}
      >
        {selected ? 'Selected ✓' : 'View Courts →'}
      </Button>
    </div>
  );
}
