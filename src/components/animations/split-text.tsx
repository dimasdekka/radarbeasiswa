"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
}

export function SplitText({
  text,
  className,
  delay = 0,
  duration = 0.6,
  stagger = 0.02,
}: SplitTextProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Reset opacity of items before animation
    const chars = containerRef.current.querySelectorAll(".char-item");
    gsap.set(chars, { opacity: 0, y: 15 });

    const ctx = gsap.context(() => {
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        delay,
        duration,
        stagger,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [text, delay, duration, stagger]);

  // Split text into words, then split words into characters to avoid line-breaking issues
  const words = text.split(" ");

  return (
    <h1
      ref={containerRef}
      className={cn("flex flex-wrap overflow-hidden leading-tight", className)}
    >
      {words.map((word, wIdx) => (
        <span key={wIdx} className="mr-[0.25em] inline-flex overflow-hidden py-1">
          {word.split("").map((char, cIdx) => (
            <span
              key={cIdx}
              className="char-item inline-block transform opacity-0 select-none"
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
