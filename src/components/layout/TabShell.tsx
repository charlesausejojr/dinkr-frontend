'use client';

import { useUIStore } from '@/store/uiStore';
import { TABS, type TabType } from '@/constants';
import { BookCourtPanel } from '@/components/courts/BookCourtPanel';
import { ListCourtPanel } from '@/components/courts/ListCourtPanel';
import { BookCoachPanel } from '@/components/coaches/BookCoachPanel';
import { BecomeCoachPanel } from '@/components/coaches/BecomeCoachPanel';
import { MyBookingsPanel } from '@/components/booking/MyBookingsPanel';
import { clsx } from 'clsx';

const panels: Record<TabType, React.ReactNode> = {
  'Book a Court':   <BookCourtPanel />,
  'List a Court':   <ListCourtPanel />,
  'Book a Coach':   <BookCoachPanel />,
  'Become a Coach': <BecomeCoachPanel />,
  'My Bookings':    <MyBookingsPanel />,
};

export function TabShell() {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 mb-8 bg-white/60 backdrop-blur-sm p-1 rounded-sm w-fit border border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-5 py-2.5 text-sm font-display font-semibold tracking-widest uppercase rounded-sm transition-all duration-150',
              activeTab === tab
                ? 'bg-court-green text-court-lime shadow-sm'
                : 'text-court-slate hover:text-court-green hover:bg-court-limeLight/30'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Panel with fade transition */}
      <div key={activeTab} className="animate-fade-in">
        {panels[activeTab]}
      </div>
    </div>
  );
}
