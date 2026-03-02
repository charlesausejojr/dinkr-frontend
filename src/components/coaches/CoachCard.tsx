'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Coach } from '@/types';

interface Props {
  coach: Coach;
  onSelect: (coach: Coach) => void;
  selected: boolean;
  isOwn?: boolean;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0][0];
  return (
    <div className="w-12 h-12 rounded-full bg-court-green flex items-center justify-center shrink-0">
      <span className="font-display font-bold text-court-lime text-sm uppercase">{initials}</span>
    </div>
  );
}

export function CoachCard({ coach, onSelect, selected, isOwn = false }: Props) {
  return (
    <div
      className={cn(
        'bg-white rounded-sm border-2 p-4 flex flex-col gap-3 transition-all duration-150',
        isOwn
          ? 'border-court-lime/40 bg-court-lime/5'
          : selected
          ? 'border-court-lime bg-court-green/5'
          : 'border-gray-200 hover:border-court-green/30'
      )}
    >
      <div className="flex items-start gap-3">
        {coach.avatar_url ? (
          <img
            src={coach.avatar_url}
            alt={coach.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <Initials name={coach.name} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold uppercase tracking-tight text-court-green">
              {coach.name}
            </h3>
            {isOwn && (
              <span className="px-2 py-0.5 bg-court-lime text-court-green text-xs font-display font-bold uppercase rounded-full tracking-wide">
                Your Profile
              </span>
            )}
          </div>
          {coach.bio && (
            <p className="text-xs font-body text-court-slate/60 mt-0.5 line-clamp-2">{coach.bio}</p>
          )}
        </div>
        <span className="shrink-0 font-display font-bold text-court-lime text-sm">
          ₱{coach.rate_per_hour}<span className="text-court-slate/40 text-xs font-body">/hr</span>
        </span>
      </div>

      {coach.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {coach.specialties.map(s => (
            <span
              key={s}
              className="px-2 py-0.5 border border-court-lime text-court-green text-xs font-body rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <Button
        variant={selected ? 'secondary' : 'primary'}
        size="sm"
        className="w-full"
        onClick={() => onSelect(coach)}
      >
        {isOwn ? 'View My Profile' : selected ? 'Selected ✓' : 'Book'}
      </Button>
    </div>
  );
}
