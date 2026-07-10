"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { pairingSchema, type PairingValues } from "@/lib/schemas";
import type { Database } from "@/types/database";

export async function createInviteCode(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("create_couple_invite");

  return {
    data: data?.[0] ?? null,
    error,
  };
}

export async function joinCoupleWithCode(
  supabase: SupabaseClient<Database>,
  values: PairingValues,
) {
  const parsed = pairingSchema.parse(values);

  const { data, error } = await supabase.rpc("join_couple_with_code", {
    invite_code_input: parsed.inviteCode.toUpperCase(),
  });

  return {
    data: data?.[0] ?? null,
    error,
  };
}

export async function unlinkCouple(supabase: SupabaseClient<Database>) {
  return supabase.rpc("unlink_couple");
}
