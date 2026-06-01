"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getGradientColors } from "@/lib/scholarship-logos";

/**
 * Image with a graceful fallback CHAIN:
 *   1. primary `src` (scholarship image)
 *   2. each url in `fallbackSrcs` in order (e.g. campus/provider logo)
 *   3. gradient placeholder with initials
 *
 * If any source fails to load (dead URL / hotlink-blocked / 404) it advances
 * to the next, and finally renders the initials placeholder.
 */
export function SafeImage({
  src,
  fallbackSrcs = [],
  alt,
  width,
  height,
  className,
  fallbackName,
  rounded,
  contain,
}: {
  src?: string | null;
  fallbackSrcs?: (string | null | undefined)[];
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackName?: string;
  rounded?: string;
  contain?: boolean;
}) {
  // Build the ordered, de-duplicated chain of candidate URLs.
  const chain = [src, ...fallbackSrcs].filter((u): u is string => !!u);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [src]);

  const name = fallbackName ?? alt;
  const [c1, c2] = getGradientColors(name);
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const current = chain[idx];

  if (!current) {
    return (
      <div
        className={cn("flex items-center justify-center", rounded, className)}
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, width: "100%", height: "100%" }}
        aria-label={alt}
      >
        <span
          className="font-display font-bold text-white/95 drop-shadow-sm"
          style={{ fontSize: Math.max(12, Math.min(width, height) / 3) }}
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      width={width}
      height={height}
      className={cn(className, contain && "object-contain")}
      unoptimized
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
