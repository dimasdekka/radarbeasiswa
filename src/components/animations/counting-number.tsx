"use client";

import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface CountingNumberProps {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
}

export function CountingNumber({
  value,
  className,
  duration = 1.5,
  delay = 0,
  suffix = "",
  prefix = "",
}: CountingNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const countObj = useRef({ val: 0 });

  useEffect(() => {
    // Reset val to 0 before starting tween
    countObj.current.val = 0;
    setDisplayValue(0);

    const ctx = gsap.context(() => {
      gsap.to(countObj.current, {
        val: value,
        duration,
        delay,
        ease: "power2.out",
        onUpdate: () => {
          setDisplayValue(Math.floor(countObj.current.val));
        },
      });
    }, elementRef);

    return () => ctx.revert();
  }, [value, duration, delay]);

  return (
    <span ref={elementRef} className={cn("font-bold tracking-tight", className)}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
