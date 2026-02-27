'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';

interface BookingConfirmedModalProps {
  open: boolean;
  onClose: () => void;
  summary: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
  } | null;
}

export function BookingConfirmedModal({ open, onClose, summary }: BookingConfirmedModalProps) {
  const setActiveTab = useUIStore(s => s.setActiveTab);

  const handleViewBookings = () => {
    onClose();
    setActiveTab('My Bookings');
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white rounded-lg shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={56} className="text-court-lime" strokeWidth={1.5} />
          </div>
          <Dialog.Title className="font-display text-2xl font-bold text-court-green uppercase tracking-tight">
            Booking Confirmed!
          </Dialog.Title>

          {summary && (
            <div className="mt-4 bg-court-green/5 border border-court-green/10 rounded-sm p-4 text-sm font-body text-left">
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-court-slate/60">What</span>
                <span className="font-semibold text-court-green">{summary.name}</span>
                <span className="text-court-slate/60">Date</span>
                <span className="font-semibold">{summary.date}</span>
                <span className="text-court-slate/60">Time</span>
                <span className="font-semibold">{summary.startTime} → {summary.endTime}</span>
                <span className="text-court-slate/60">Total</span>
                <span className="font-display font-bold text-court-lime text-base">₱{summary.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-6">
            <Button className="w-full" onClick={handleViewBookings}>
              View My Bookings
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
