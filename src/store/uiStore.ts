import { create } from "zustand";
import type { TabType } from "@/constants";

interface UIState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "Book a Court",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
