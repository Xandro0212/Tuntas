import { avatarColor } from "@/lib/constants";
import { initials } from "@/lib/dates";

export function Avatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const colors = avatarColor(name);
  const sizes = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-7 w-7 text-[10px]",
    md: "h-8 w-8 text-[11px]",
    lg: "h-10 w-10 text-[12px]",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white ${sizes[size]} ${className}`}
      style={{ background: colors.bg, color: colors.text }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
