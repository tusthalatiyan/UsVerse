"use client";

import { create } from "zustand";

interface ChatState {
  draft: string;
  setDraft: (value: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  draft: "",
  setDraft: (draft) => set({ draft }),
}));
