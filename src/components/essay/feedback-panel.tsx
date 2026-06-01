"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, AlertCircle, Lightbulb, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export interface ParagraphFeedback {
  index: number;
  preview: string;
  score: number;
  comment: string;
  suggestion: string;
}

function RadialScore({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circleRef = useRef<SVGCircleElement>(null);
  
  const radius = 24;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const scoreVal = { val: 0 };
    const ctx = gsap.context(() => {
      if (circleRef.current) {
        const offset = circumference - (score / 10) * circumference;
        gsap.fromTo(circleRef.current,
          { strokeDashoffset: circumference },
          { strokeDashoffset: offset, duration: 1.5, ease: "power3.out" }
        );
      }
      
      gsap.to(scoreVal, {
        val: score,
        duration: 1.5,
        ease: "power3.out",
        onUpdate: () => {
          setAnimatedScore(parseFloat(scoreVal.val.toFixed(1)));
        }
      });
    });
    return () => ctx.revert();
  }, [score, circumference]);

  const rating = score >= 8 ? "Sangat Baik" : score >= 6 ? "Cukup Baik" : "Perlu Perbaikan";
  const colorClass = score >= 8 ? "text-accent" : score >= 6 ? "text-primary" : "text-destructive";
  const strokeColor = score >= 8 ? "hsl(var(--accent))" : score >= 6 ? "hsl(var(--primary))" : "hsl(var(--destructive))";

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl border border-border/20 bg-muted/20 shadow-inner mb-4">
      <div className="relative flex items-center justify-center h-14 w-14 flex-shrink-0">
        <svg className="transform -rotate-90 w-14 h-14">
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="stroke-muted-foreground/10 fill-none"
            strokeWidth={strokeWidth}
          />
          <circle
            ref={circleRef}
            cx="28"
            cy="28"
            r={radius}
            className="fill-none transition-all duration-300"
            strokeWidth={strokeWidth}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-xs font-black text-foreground leading-none">{animatedScore}</span>
          <span className="text-[6px] font-mono uppercase text-muted-foreground font-bold mt-0.5">/10</span>
        </div>
      </div>
      
      <div className="min-w-0">
        <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">SKOR RATA-RATA ESAl</p>
        <p className={cn("font-display text-xs font-extrabold tracking-tight mt-0.5", colorClass)}>{rating}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">AI menganalisis tata bahasa dan alur logika esai Anda.</p>
      </div>
    </div>
  );
}

export function FeedbackPanel({
  essayId,
  initialFeedback,
}: {
  essayId: string;
  initialFeedback: ParagraphFeedback[] | null;
}) {
  const [feedback, setFeedback] = useState<ParagraphFeedback[] | null>(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getFeedback() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/essays/${essayId}/feedback`, { method: "POST" });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { 
        setError(data.error ?? "Gagal memproses ulasan AI"); 
        return; 
      }
      setFeedback(data.feedback);
    } catch {
      setError("Kesalahan koneksi saat meminta feedback");
      setLoading(false);
    }
  }

  return (
    <div className="glass-premium rounded-xl border border-border/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/10 bg-muted/10 px-4 py-3">
        <div className="flex items-center gap-1.5 text-foreground/80 font-bold">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="font-mono text-[10px] uppercase tracking-widest">Analisis Esai AI</p>
        </div>
        <Button 
          size="sm" 
          variant={feedback ? "ghost" : "accent"} 
          onClick={getFeedback} 
          disabled={loading}
          className="h-7 text-[10px] font-bold uppercase tracking-wider px-3 rounded-lg"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : feedback ? (
            <RefreshCw className="h-3 w-3 mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1 text-accent-foreground" />
          )}
          {loading ? "Meninjau..." : feedback ? "Ulangi" : "Minta Feedback"}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {!feedback && !loading && (
          <div className="text-center py-4 space-y-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/60 mx-auto animate-pulse" />
            <p className="text-xs text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
              Setelah draf esai Anda terisi di editor, klik <strong>Minta Feedback</strong> untuk mendapatkan evaluasi mendalam.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-3 py-2 flex flex-col items-center justify-center min-h-[120px]">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Membaca dan Menganalisis Draf Esai...</p>
          </div>
        )}

        {error && (
          <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-3 flex items-start gap-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {feedback && !loading && (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            <RadialScore score={parseFloat((feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length).toFixed(1))} />
            {feedback.map((f) => {
              const rating = f.score >= 8 ? "high" : f.score >= 6 ? "good" : f.score >= 4 ? "fair" : "low";
              const scoreColor = rating === "high" 
                ? "bg-accent/10 text-accent border-accent/20" 
                : rating === "good" 
                ? "bg-primary/10 text-primary border-primary/20" 
                : rating === "fair" 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                : "bg-destructive/10 text-destructive border-destructive/20";
              
              return (
                <div key={f.index} className="border border-border/20 bg-card/60 backdrop-blur-sm p-4 rounded-xl space-y-2.5 shadow-xs">
                  <div className="flex items-start justify-between gap-3 border-b border-border/10 pb-2">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 line-clamp-1">
                      Paragraf {f.index} — &quot;{f.preview}&quot;
                    </p>
                    <Badge className={cn("font-mono text-[10px] font-bold border px-1.5 py-0.5", scoreColor)}>{f.score}/10</Badge>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="text-xs">
                      <span className="font-semibold text-foreground/80 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        Ulasan Paragraf
                      </span>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed pl-4.5">{f.comment}</p>
                    </div>
                    
                    <div className="text-xs border-t border-border/10 pt-2.5">
                      <span className="font-semibold text-accent flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5 text-accent animate-pulse" />
                        Saran Perbaikan
                      </span>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed pl-4.5">{f.suggestion}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
