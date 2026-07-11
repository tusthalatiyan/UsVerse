"use client";

import { useEffect, useMemo, useState } from "react";

import { useOptionalSupabase } from "@/hooks/use-supabase";
import type { Tables } from "@/types/database";

type ProfileRow = Tables<"profiles">;

function mergeProfiles(currentProfiles: ProfileRow[], nextProfiles: ProfileRow[]) {
  const profileMap = new Map(currentProfiles.map((profile) => [profile.id, profile]));

  nextProfiles.forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  return Array.from(profileMap.values());
}

export function useProfileLookup(
  initialProfiles: ProfileRow[],
  referencedProfileIds: string[],
) {
  const supabase = useOptionalSupabase();
  const [fetchedProfiles, setFetchedProfiles] = useState<ProfileRow[]>([]);
  const referencedProfileKey = useMemo(
    () => Array.from(new Set(referencedProfileIds.filter(Boolean))).sort().join(","),
    [referencedProfileIds],
  );

  const profileMap = useMemo(() => {
    const map = new Map<string, ProfileRow>();

    initialProfiles.forEach((profile) => {
      map.set(profile.id, profile);
    });

    fetchedProfiles.forEach((profile) => {
      map.set(profile.id, profile);
    });

    return map;
  }, [fetchedProfiles, initialProfiles]);

  useEffect(() => {
    if (!supabase || !referencedProfileKey) {
      return;
    }

    const missingProfileIds = referencedProfileKey
      .split(",")
      .filter((profileId) => profileId && !profileMap.has(profileId));

    if (!missingProfileIds.length) {
      return;
    }

    let cancelled = false;

    void supabase
      .from("profiles")
      .select("*")
      .in("id", missingProfileIds)
      .then(({ data }) => {
        if (cancelled || !data?.length) {
          return;
        }

        setFetchedProfiles((currentProfiles) =>
          mergeProfiles(currentProfiles, data),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [profileMap, referencedProfileKey, supabase]);

  return profileMap;
}
