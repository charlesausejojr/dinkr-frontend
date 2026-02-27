'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Court } from '@/types';

interface Props {
  court: Court;
  onSelect: (court: Court) => void;
  selected: boolean;
}

export function CourtCard({ court, onSelect, selected }: Props) {
  return (
    <div
      className={cn(
        'bg-white rounded-sm border-2 p-4 flex flex-col gap-3 transition-all duration-150',
        selected
          ? 'border-court-lime bg-court-green/5'
          : 'border-gray-200 hover:border-court-green/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-base font-bold uppercase tracking-tight text-court-green">
          {court.name}
        </h4>
        {court.surface_type && (
          <span className="shrink-0 px-2 py-0.5 bg-gray-100 text-court-slate text-xs font-body rounded-full">
            {court.surface_type}
          </span>
        )}
      </div>

      {court.description && (
        <p className="text-xs font-body text-court-slate/60 line-clamp-2">
          {court.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-court-lime text-lg">
          ₱{court.price_per_hour}
          <span className="text-court-slate/50 text-xs font-body font-normal">/hr</span>
        </span>
        <Button
          variant={selected ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onSelect(court)}
        >
          {selected ? 'Selected ✓' : 'Select'}
        </Button>
      </div>
    </div>
  );
}
