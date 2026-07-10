import { Sparkles } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-rose-200/80 bg-white/45 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-rose-100/80 text-rose-500">
        <Sparkles className="size-5" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-foreground/70">{description}</p>
    </div>
  );
}
