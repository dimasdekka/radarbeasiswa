"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

/**
 * Elegant word-by-word mask reveal for editorial headlines.
 * Each word rises from behind a clip mask — refined, not glitchy.
 */
export function WordsReveal({
  text,
  className,
  delay = 0,
  stagger = 0.08,
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(".wr-word");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(targets, { yPercent: 0, opacity: 1 });
      return;
    }

    gsap.set(targets, { yPercent: 115, opacity: 0 });
    gsap.to(targets, {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      delay,
      stagger,
      ease: "power4.out",
    });
  }, [text, delay, stagger]);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} className={cn("flex flex-wrap justify-center", className)}>
      {words.map((word, i) => (
        <span key={i} className="mr-[0.26em] inline-flex overflow-hidden px-[0.04em] pb-[0.3em] -mb-[0.3em] last:mr-0">
          <span className="wr-word inline-block will-change-transform">{word}</span>
        </span>
      ))}
    </Component>
  );
}
