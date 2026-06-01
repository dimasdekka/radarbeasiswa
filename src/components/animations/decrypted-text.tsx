"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface DecryptedTextProps {
  text: string;
  className?: string;
  speed?: number;
  maxIterations?: number;
  delay?: number;
}

export function DecryptedText({
  text,
  className,
  speed = 30,
  maxIterations = 4,
  delay = 0,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?";
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let iteration = 0;
      
      intervalRef.current = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < Math.floor(iteration)) return text[index];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(intervalRef.current!);
          setDisplayText(text); // Ensure it resolves perfectly to the final text
        }

        iteration += 1 / maxIterations;
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, maxIterations, delay]);

  return (
    <span className={cn("inline-block", className)}>
      {displayText || text}
    </span>
  );
}
