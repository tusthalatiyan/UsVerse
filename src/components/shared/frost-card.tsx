import { cn } from "@/lib/utils";

export function FrostCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass-card soft-mask rounded-[2rem] p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
