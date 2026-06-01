import { cn } from "@/lib/utils";

/**
 * Celestial backdrop — subtle aurora glow + grid, calm enough for app pages.
 */
export function AuroraBackground({
  className,
  grid = true,
  grain = true,
}: {
  className?: string;
  grid?: boolean;
  animatedGrid?: boolean;
  grain?: boolean;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {grid && <div className="absolute inset-0 bg-grid opacity-30 mask-radial-faded" />}
      <div className="absolute -top-40 left-1/4 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[hsl(var(--aurora-1)/0.12)] blur-[130px]" />
      <div className="absolute -top-20 right-0 h-[26rem] w-[26rem] rounded-full bg-[hsl(var(--aurora-3)/0.1)] blur-[130px]" />
      {grain && <div className="paper-grain opacity-[0.03]" />}
    </div>
  );
}
