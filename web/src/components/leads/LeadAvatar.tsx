import { avatarTone, initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = { id: string; name: string; size?: "sm" | "lg" };

export function LeadAvatar({ id, name, size = "sm" }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        size === "sm" ? "size-9 text-xs" : "size-12 text-base",
        avatarTone(id),
      )}
    >
      {initials(name)}
    </span>
  );
}
