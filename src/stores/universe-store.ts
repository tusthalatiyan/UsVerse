"use client";

import { create } from "zustand";

import type { Enums } from "@/types/database";

type ThemePreference = Enums<"theme_preference">;

interface UniverseState {
  theme: ThemePreference;
  notificationSheetOpen: boolean;
  celebrationBurst: number;
  activeCategory: string;
  setTheme: (theme: ThemePreference) => void;
  setNotificationSheetOpen: (open: boolean) => void;
  triggerCelebration: () => void;
  setActiveCategory: (category: string) => void;
}

export const useUniverseStore = create<UniverseState>((set) => ({
  theme: "rosewater",
  notificationSheetOpen: false,
  celebrationBurst: 0,
  activeCategory: "all",
  setTheme: (theme) => set({ theme }),
  setNotificationSheetOpen: (notificationSheetOpen) =>
    set({ notificationSheetOpen }),
  triggerCelebration: () =>
    set((state) => ({ celebrationBurst: state.celebrationBurst + 1 })),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
}));
