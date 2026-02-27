import { create } from 'zustand';
import { type TabType } from '@/constants';

interface UIState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'Book a Court',
  setActiveTab: (tab) => set({ activeTab: tab }),
  authModalOpen: false,
  setAuthModalOpen: (open) => set({ authModalOpen: open }),
}));
