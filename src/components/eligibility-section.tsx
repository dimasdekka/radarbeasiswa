"use client";

import { useEffect, useState, useRef } from "react";
import type { EligibilityResult } from "@/lib/matching";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface ExplainResponse {
  eligibility: EligibilityResult;
  explanation: string;
  similarity: number | null;
}

export function EligibilitySection({ beasiswaId }: { beasiswaId: string }) {
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/beasiswa/${beasiswaId}/explain`, { method: "POST" });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Gagal memuat kelayakan");
          setLoading(false);
          return;
        }
        setData(json);
      } catch {
        setError("Gagal memuat analisis kelayakan");
      } finally {
        setLoading(false);
      }
    })();
  }, [beasiswaId]);

  useEffect(() => {
    if (!data) return;

    const scoreVal = { val: 0 };
    const ctx = gsap.context(() => {
      if (progressBarRef.current) {
        gsap.fromTo(progressBarRef.current,
          { width: "0%" },
          { width: `${data.eligibility.score}%`, duration: 1.8, ease: "power3.out" }
        );
      }

      gsap.to(scoreVal, {
        val: data.eligibility.score,
        duration: 1.8,
        ease: "power3.out",
        onUpdate: () => {
          setAnimatedScore(Math.floor(scoreVal.val));
        }
      });

      gsap.fromTo(".diagnosis-item",
        { opacity: 0, x: -12, filter: "blur(3px)" },
        { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 }
      );
    });

    return () => ctx.revert();
  }, [data]);

  if (loading) {
    return (
      <Card className="glass-premium border-border/30">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[160px] gap-2">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-bold">AI Sedang Menganalisis Profilmu...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-destructive/20 bg-destructive/5 rounded-xl">
        <CardContent className="p-6 flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-xs sm:text-sm text-destructive font-semibold">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const e = data.eligibility;
  const progressColor = e.score >= 80 ? "bg-accent" : e.score >= 60 ? "bg-primary" : e.score >= 40 ? "bg-amber-500" : "bg-destructive";
  const badgeColor = e.score >= 80 
    ? "bg-accent/10 text-accent border-accent/25" 
    : e.score >= 60 
    ? "bg-primary/10 text-primary border-primary/25" 
    : e.score >= 40 
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25" 
    : "bg-destructive/10 text-destructive border-destructive/25";

  return (
    <Card className="glass-premium border-border/30 overflow-hidden shadow-sm">
      <CardContent className="space-y-6 p-6">
        {/* Score & Progress bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-display text-sm font-extrabold uppercase tracking-widest text-foreground">AI Match Diagnostics</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 bg-muted rounded-full h-2 overflow-hidden hidden sm:block">
              <div 
                ref={progressBarRef} 
                className={cn("h-full", progressColor)} 
                style={{ width: "0%" }} 
              />
            </div>
            <Badge className={cn("font-mono text-xs uppercase font-bold tracking-wider border px-2.5 py-0.5", badgeColor)}>
              {animatedScore}% Match Score
            </Badge>
          </div>
        </div>

        {/* Diagnosis list */}
        <div className="space-y-4">
          {/* Blocks, warnings, matches */}
          {e.blockers.length === 0 && e.warnings.length === 0 && e.matches.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-2">Belum ada diagnosis yang terangkum.</p>
          )}

          {e.matches.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-accent flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-accent" /> Kriteria Memenuhi ({e.matches.length})
              </h4>
              <ul className="space-y-1.5 pl-4 border-l border-accent/25">
                {e.matches.map((m, i) => (
                  <li key={`m-${i}`} className="diagnosis-item text-xs sm:text-sm text-foreground/80 flex items-start gap-1.5 opacity-0">
                    <span className="text-accent font-bold mt-0.5">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {e.warnings.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" /> Peringatan / Perlu Catatan ({e.warnings.length})
              </h4>
              <ul className="space-y-1.5 pl-4 border-l border-amber-500/25">
                {e.warnings.map((w, i) => (
                  <li key={`w-${i}`} className="diagnosis-item text-xs sm:text-sm text-foreground/80 flex items-start gap-1.5 opacity-0">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {e.blockers.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-destructive flex items-center gap-1">
                <XCircle className="h-3 w-3 text-destructive" /> Kriteria Tidak Memenuhi ({e.blockers.length})
              </h4>
              <ul className="space-y-1.5 pl-4 border-l border-destructive/25">
                {e.blockers.map((b, i) => (
                  <li key={`b-${i}`} className="diagnosis-item text-xs sm:text-sm text-foreground/80 flex items-start gap-1.5 opacity-0">
                    <span className="text-destructive font-bold mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Explanation Insight box */}
        {data.explanation && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04] p-4 text-xs sm:text-sm shadow-inner relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
              <Sparkles className="h-24 w-24 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 mb-2 font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>Analisis AI & Rekomendasi</span>
            </div>
            <p className="text-muted-foreground leading-relaxed pl-5 whitespace-pre-line">{data.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
