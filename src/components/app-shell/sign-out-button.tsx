"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";

import { useOptionalSupabase } from "@/hooks/use-supabase";
import { hasSupabaseConfig } from "@/lib/env";
import { logout } from "@/services/auth-service";
import { toErrorMessage } from "@/services/service-utils";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  mode = "live",
}: {
  mode?: "live" | "preview";
}) {
  const router = useRouter();
  const supabase = useOptionalSupabase();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="rounded-full"
      onClick={() =>
        startTransition(async () => {
          if (!hasSupabaseConfig || !supabase || mode === "preview") {
            toast.success("Preview closed.");
            router.replace("/");
            return;
          }

          const { error } = await logout(supabase);

          if (error) {
            toast.error(toErrorMessage(error));
            return;
          }

          router.replace("/");
          router.refresh();
        })
      }
    >
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      <span className="hidden sm:inline">
        {mode === "preview" ? "Exit preview" : "Log out"}
      </span>
    </Button>
  );
}
