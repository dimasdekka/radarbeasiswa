"use client";

import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export function SettingsThemeRow() {
  const { theme, mounted, toggle } = useTheme();

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-muted/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-card/60 text-primary">
          {mounted && theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Mode {mounted ? (theme === "dark" ? "Gelap" : "Terang") : "—"}</p>
          <p className="text-xs text-muted-foreground">Atur tema antarmuka sesuai preferensimu.</p>
        </div>
      </div>
      <button
        onClick={toggle}
        role="switch"
        aria-checked={theme === "dark"}
        aria-label="Toggle tema gelap/terang"
        className={cn(
          "relative h-7 w-12 flex-none rounded-full border transition-colors duration-300 cursor-pointer",
          theme === "dark" ? "border-primary/40 bg-primary/30" : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-foreground shadow transition-all duration-300",
            theme === "dark" ? "left-[26px]" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

export function LogoutRow() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-display text-sm font-bold uppercase tracking-widest text-destructive">Keluar Akun</p>
        <p className="mt-1 text-xs text-muted-foreground">Akhiri sesi di perangkat ini.</p>
      </div>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-destructive transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>
    </div>
  );
}
