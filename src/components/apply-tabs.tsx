"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "essay", label: "Essay" },
  { slug: "checklist", label: "Checklist" },
  { slug: "progress", label: "Progress" },
];

export function ApplyTabs({ applicationId }: { applicationId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border/30">
      {TABS.map((t) => {
        const href = `/apply/${applicationId}/${t.slug}`;
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={t.slug}
            href={href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
