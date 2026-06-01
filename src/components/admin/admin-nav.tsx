"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  LogOut,
  LayoutList,
  ClipboardCheck,
  Radio,
  ArrowLeft,
} from "lucide-react";

const adminNav = [
  { href: "/admin/beasiswa", label: "Kelola Beasiswa", icon: LayoutList },
  { href: "/admin/scraping-review", label: "Review Scraping", icon: ClipboardCheck },
  { href: "/admin/scraping-sources", label: "Sumber", icon: Radio },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-50 border-b border-border/30 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-5">
          <Link href="/admin/beasiswa" className="flex items-center gap-2 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover:bg-primary/25">
              <span className="font-mono text-lg font-black tracking-tighter">R</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Radar<span className="text-gradient font-black">Beasiswa</span>
            </span>
            <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-accent border border-accent/25">
              Admin
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {adminNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 lg:inline">
            {email}
          </span>
          <Link
            href="/dashboard"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-border/30 bg-muted/10 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            App
          </Link>

          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/30 bg-muted/30 text-muted-foreground transition-all duration-300 hover:bg-muted/80 hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-yellow-400" />}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border/30 bg-muted/10 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/35"
            title="Keluar"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/20 px-4 py-2 md:hidden">
        {adminNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
