import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

const PERKS = [
  "119+ beasiswa terkurasi",
  "AI matching engine + alasan",
  "Essay Studio dengan AI",
  "Smart deadline reminder",
];

export function AuthAside({ tag, headline, sub }: { tag: string; headline: React.ReactNode; sub: string }) {
  return (
    <aside className="relative isolate hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
      {/* Cosmic gradient base */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a0b2e] via-primary to-[#2d1b4e]" />
      <div className="absolute inset-0 z-0 bg-grid opacity-[0.12] mask-radial-faded" />
      {/* Aurora blobs */}
      <div className="absolute -left-20 top-10 z-0 h-80 w-80 rounded-full bg-[hsl(var(--aurora-2)/0.4)] blur-[100px]" />
      <div className="absolute -right-16 bottom-10 z-0 h-80 w-80 rounded-full bg-[hsl(var(--aurora-3)/0.35)] blur-[100px]" />
      <div className="absolute right-1/3 top-1/2 z-0 h-64 w-64 rounded-full bg-[hsl(var(--aurora-4)/0.25)] blur-[90px]" />
      <div className="noise-overlay" />

      <Link href="/" className="relative z-10 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="font-display text-2xl font-bold tracking-tight">
          Radar<span className="opacity-70">Beasiswa</span>
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-50">/ {tag}</span>
      </Link>

      <div className="relative z-10 max-w-lg">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">Bertenaga Gemini AI</p>
        <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">{headline}</h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed opacity-80">{sub}</p>

        <ul className="mt-9 space-y-3.5">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-3 text-sm font-medium opacity-90">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                <Check className="h-3.5 w-3.5" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] opacity-60">
        <span>RadarBeasiswa 2026</span>
        <span className="h-px w-10 bg-white/30" />
        <span>Gratis selamanya</span>
      </div>
    </aside>
  );
}
