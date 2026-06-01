"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return { theme, mounted, toggle };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, mounted, toggle } = useTheme();
  if (!mounted) return <div className={cn("h-9 w-9", className)} aria-hidden />;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      className={cn(
        "group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-border bg-transparent text-muted-foreground transition-colors duration-300 hover:bg-muted/60 hover:text-foreground cursor-pointer",
        className
      )}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-500",
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
        strokeWidth={1.5}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-500",
          theme === "light" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        )}
        strokeWidth={1.5}
      />
    </button>
  );
}
