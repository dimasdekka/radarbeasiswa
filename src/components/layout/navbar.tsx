"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogOut, LayoutDashboard, Compass, User, Settings, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/beasiswa", label: "Beasiswa", icon: Compass },
  { href: "/profil", label: "Profil", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.role === "ADMIN");
        }
      } catch {}
    })();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-6">
        <Link href={isAdmin ? "/admin/beasiswa" : "/dashboard"} className="flex items-center gap-2">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-accent opacity-90" />
            <Sparkles className="relative h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Radar<span className="text-gradient">Beasiswa</span>
          </span>
          {isAdmin && (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-accent">
              Admin
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-1">
          {isAdmin && (
            <>
              <Link
                href="/admin/beasiswa"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Admin</span>
              </Link>
              <div className="mx-1 h-5 w-px bg-border" />
            </>
          )}

          {userNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          <div className="mx-1 h-5 w-px bg-border" />

          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            title="Keluar Akun"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
