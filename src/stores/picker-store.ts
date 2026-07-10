"use client";

import { create } from "zustand";

interface PickerState {
  category: string;
  weightedMode: boolean;
  excludeCompleted: boolean;
  spinning: boolean;
  setCategory: (value: string) => void;
  setWeightedMode: (value: boolean) => void;
  setExcludeCompleted: (value: boolean) => void;
  setSpinning: (value: boolean) => void;
}

export const usePickerStore = create<PickerState>((set) => ({
  category: "all",
  weightedMode: true,
  excludeCompleted: true,
  spinning: false,
  setCategory: (category) => set({ category }),
  setWeightedMode: (weightedMode) => set({ weightedMode }),
  setExcludeCompleted: (excludeCompleted) => set({ excludeCompleted }),
  setSpinning: (spinning) => set({ spinning }),
}));
