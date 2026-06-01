"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Direction = "up" | "left" | "right" | "scale" | "none";

const fromVars: Record<Direction, gsap.TweenVars> = {
  up: { y: 40 },
  left: { x: 40 },
  right: { x: -40 },
  scale: { scale: 0.92 },
  none: {},
};

/**
 * GSAP ScrollTrigger reveal. Smooth, eased, respects reduced-motion.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 1,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(el, { opacity: 0, ...fromVars[direction] });

      // If the element is already within (or above) the viewport on mount —
      // common for grids rendered after an async fetch — reveal immediately so
      // cards never get stuck invisible when ScrollTrigger misses them.
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.95;

      if (inView) {
        gsap.to(el, { opacity: 1, x: 0, y: 0, scale: 1, duration, delay, ease: "power3.out" });
      } else {
        gsap.to(el, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            toggleActions: "play none none none",
          },
        });
      }
    }, el);

    // Safety net: whatever happens, never leave content invisible.
    // Capped so an accidental large `delay` can't hide content for minutes.
    const failsafe = window.setTimeout(() => {
      if (ref.current) gsap.set(ref.current, { opacity: 1, x: 0, y: 0, scale: 1 });
    }, Math.min(2000, 1200 + delay * 1000));

    return () => {
      ctx.revert();
      window.clearTimeout(failsafe);
    };
  }, [direction, delay, duration]);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} className={cn(className)} style={{ opacity: 0 }}>
      {children}
    </Component>
  );
}
