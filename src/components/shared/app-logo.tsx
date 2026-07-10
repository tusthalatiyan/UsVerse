import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-11 items-center justify-center rounded-[1.35rem] border border-white/70 bg-white/80 shadow-[0_16px_32px_rgba(255,180,180,0.22)] backdrop-blur-xl">
        <Sparkles className="size-5 text-rose-500" />
      </div>
      <div className={compact ? "hidden sm:block" : "block"}>
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-rose-400">
          UsVerse
        </p>
        <p className="text-sm text-foreground/70">your tiny shared universe</p>
      </div>
    </div>
  );
}
