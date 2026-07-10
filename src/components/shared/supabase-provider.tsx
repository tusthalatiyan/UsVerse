"use client";

import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { hasSupabaseConfig } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

export function SupabaseProvider({ children }: PropsWithChildren) {
  const [client] = useState(() =>
    hasSupabaseConfig ? createBrowserSupabaseClient() : null,
  );

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useOptionalSupabaseContext() {
  return useContext(SupabaseContext);
}

export function useSupabaseContext() {
  const client = useOptionalSupabaseContext();

  if (!client) {
    throw new Error("useSupabaseContext must be used inside SupabaseProvider.");
  }

  return client;
}
