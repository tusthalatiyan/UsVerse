"use client";

import { useEffect } from "react";

import { useUniverseStore } from "@/stores/universe-store";
import type { Enums } from "@/types/database";

export function useDocumentTheme(theme: Enums<"theme_preference">) {
  const setTheme = useUniverseStore((state) => state.setTheme);

  useEffect(() => {
    document.body.dataset.theme = theme;
    setTheme(theme);
  }, [setTheme, theme]);
}
