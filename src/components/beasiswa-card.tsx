"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCountryFlagSmall, getGradientColors, getProviderLogo } from "@/lib/scholarship-logos";
import { Calendar, GraduationCap, ArrowUpRight } from "lucide-react";

export interface BeasiswaCardData {
  id: string;
  nama: string;
  provider: string;
  negara: string;
  jenjang: string[];
  cakupan: string[];
  deadline: Date | string | null;
  deadlineNote: string | null;
  sourceType: string;
  verified: boolean;
  matchScore: number | null;
  imageUrl?: string | null;
  urlResmi?: string | null;
}

function formatDeadline(deadline: Date | string | null, deadlineNote: string | null) {
  if (deadline) {
    return new Date(deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }
  return deadlineNote ?? "Belum rilis";
}

export function BeasiswaCard({ b, isAdmin }: { b: BeasiswaCardData; isAdmin?: boolean }) {
  const score = b.matchScore;
  const scoreTone = score == null ? null : score >= 75 ? "high" : score >= 50 ? "mid" : "low";
  const [c1, c2] = getGradientColors(b.nama);
  const flagUrl = getCountryFlagSmall(b.negara);
  const providerLogo = getProviderLogo(b.urlResmi);
  const [imgFailed, setImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Link
      href={`/beasiswa/${b.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_24px_50px_-22px_hsl(var(--primary)/0.4)]"
    >
      {/* glow on hover */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      {/* Cover */}
      <div
        className="relative h-36 w-full overflow-hidden border-b border-border"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        {b.imageUrl && !imgFailed ? (
          <Image
            src={b.imageUrl}
            alt={b.nama}
            width={640}
            height={360}
            className="img-warm h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
            onError={() => setImgFailed(true)}
          />
        ) : providerLogo && !logoFailed ? (
          // Tier 2: provider/campus logo as a crisp centered "chip" — modest
          // size keeps even small favicons sharp (no blurry upscaling).
          <div className="flex h-full w-full items-center justify-center p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 p-2.5 shadow-lg ring-1 ring-black/5">
              <Image
                src={providerLogo}
                alt={b.provider}
                width={64}
                height={64}
                className="max-h-full max-w-full object-contain"
                unoptimized
                onError={() => setLogoFailed(true)}
              />
            </div>
          </div>
        ) : (
          // Tier 3: initials
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-4xl font-semibold italic text-white/95 drop-shadow-sm">
              {b.nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Flag */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 shadow-sm ring-1 ring-black/5">
          <Image src={flagUrl} alt={b.negara} width={20} height={14} className="h-3 w-auto rounded-[2px] object-cover" unoptimized />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground/80">{b.negara.substring(0, 3)}</span>
        </div>

        {score != null && (
          <div
            className={cn(
              "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur",
              scoreTone === "high" && "bg-primary/90 text-primary-foreground",
              scoreTone === "mid" && "bg-accent/90 text-accent-foreground",
              scoreTone === "low" && "bg-background/90 text-muted-foreground ring-1 ring-border"
            )}
          >
            {score}% cocok
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1.5">
          {b.verified && <Badge variant="success" className="text-[9px]">Verified</Badge>}
          {isAdmin && b.sourceType === "SCRAPED" && <Badge variant="secondary" className="text-[9px]">Scraped</Badge>}
        </div>

        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {b.nama}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{b.provider}</p>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            {b.jenjang.join(", ") || "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
            {formatDeadline(b.deadline, b.deadlineNote)}
          </span>
        </div>
      </div>

      {/* Footer CTA strip */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs font-medium text-muted-foreground transition-colors group-hover:bg-muted/40 group-hover:text-foreground">
        <span className="uppercase tracking-[0.12em]">Lihat Detail</span>
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
