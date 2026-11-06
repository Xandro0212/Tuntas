/**
 * Tuntas brand assets are extracted from the supplied logo image.
 * The mark keeps its orbit and sparkle; the full lockup includes the wordmark.
 */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/tuntas-mark-final.png?v=4"
      alt="Tuntas"
      draggable={false}
      className={`shrink-0 select-none object-contain ${className}`}
    />
  );
}

export function Logo({
  compact = false,
  variant = "dark",
  size = "md",
  className = "",
}: {
  compact?: boolean;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  void variant;
  const fullSize = {
    sm: "h-8",
    md: "h-9 sm:h-10",
    lg: "h-12 sm:h-14",
  }[size];

  if (compact) {
    return <BrandMark className={fullSize} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/tuntas-logo-final.png?v=4"
      alt="Tuntas"
      draggable={false}
      className={`w-auto select-none object-contain ${fullSize} ${className}`}
    />
  );
}
