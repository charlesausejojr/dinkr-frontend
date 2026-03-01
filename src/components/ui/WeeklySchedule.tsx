'use client';

import type { WeekSchedule } from '@/types';

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

interface Props {
  schedule: WeekSchedule | null | undefined;
  /** Label shown when a day is marked closed. Defaults to "Closed". */
  closedLabel?: string;
  /** Fallback text when no schedule exists yet. */
  emptyLabel?: string;
}

export function WeeklySchedule({
  schedule,
  closedLabel = 'Closed',
  emptyLabel = 'No hours specified yet.',
}: Props) {
  // JS getDay(): 0=Sun…6=Sat → convert to our 0=Mon…6=Sun index
  const todayKey = WEEK_DAYS[(new Date().getDay() + 6) % 7];

  if (!schedule || Object.keys(schedule).length === 0) {
    return (
      <p className="text-xs font-body text-court-slate/40 italic">{emptyLabel}</p>
    );
  }

  return (
    <div className="border-2 border-gray-100 rounded-sm overflow-hidden">
      {WEEK_DAYS.map((day, i) => {
        const s = schedule[day] ?? { open: '06:00', close: '22:00', closed: false };
        const isToday = day === todayKey;
        return (
          <div
            key={day}
            className={`flex items-center gap-3 px-3 py-1.5 text-xs font-body
              ${i !== WEEK_DAYS.length - 1 ? 'border-b border-gray-100' : ''}
              ${isToday ? 'bg-court-lime/10' : ''}
            `}
          >
            <span className={`w-8 font-display font-bold uppercase tracking-widest shrink-0 ${isToday ? 'text-court-green' : 'text-court-slate/50'}`}>
              {DAY_SHORT[day]}
            </span>

            {s.closed ? (
              <span className="text-gray-400">{closedLabel}</span>
            ) : (
              <span className={isToday ? 'text-court-green font-semibold' : 'text-court-slate'}>
                {s.open} – {s.close}
              </span>
            )}

            {isToday && (
              <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-display font-bold rounded-full leading-none ${s.closed ? 'bg-gray-100 text-gray-400' : 'bg-court-lime text-court-green'}`}>
                Today
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
