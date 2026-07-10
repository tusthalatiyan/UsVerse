import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function UserAvatar({
  avatarKey,
  nickname,
  className,
}: {
  avatarKey: string;
  nickname: string;
  className?: string;
}) {
  const avatar = avatarOptions.find((option) => option.key === avatarKey);

  return (
    <Avatar className={cn("size-11 rounded-[1.2rem] border border-white/70", className)}>
      <AvatarFallback
        className={cn(
          "rounded-[1.2rem] bg-gradient-to-br text-lg",
          avatar?.aura ?? "from-rose-200 to-orange-100",
        )}
      >
        {avatar?.emoji ?? nickname.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
