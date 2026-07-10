import { cn } from "@/lib/utils";

export function PageHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-foreground/72 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
