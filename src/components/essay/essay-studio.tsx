"use client";

import { useState, useEffect, useRef } from "react";
import { TipTapEditor } from "./tiptap-editor";
import { GuidedQuestionsPanel } from "./guided-questions-panel";
import { FeedbackPanel, type ParagraphFeedback } from "./feedback-panel";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, Award, AlignLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface EssayStudioProps {
  essayId: string;
  initialJudul: string;
  initialKonten: string;
  initialFeedback: ParagraphFeedback[] | null;
  rubrikEssay: Record<string, string> | null;
}

export function EssayStudio({
  essayId,
  initialJudul,
  initialKonten,
  initialFeedback,
  rubrikEssay,
}: EssayStudioProps) {
  const [judul, setJudul] = useState(initialJudul);
  const [konten, setKonten] = useState(initialKonten);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isZenMode, setIsZenMode] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      const res = await fetch(`/api/essays/${essayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, konten }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } else {
        setSaveStatus("idle");
      }
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [judul, konten, essayId]);

  return (
    <div className={cn(
      "grid grid-cols-1 gap-6 items-start transition-all duration-500 ease-in-out",
      isZenMode ? "lg:grid-cols-[1fr_0px] lg:gap-0" : "lg:grid-cols-[1fr_380px]"
    )}>
      {/* Editor Column */}
      <div className="space-y-4 w-full">
        <div className="glass-premium rounded-xl p-4 border border-border/30 shadow-sm flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Ketik Judul Esai Anda..."
              className="!h-10 border-0 bg-transparent !px-2 font-display !text-xl font-bold tracking-tightish !rounded-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 border-b border-border/20 focus-visible:border-primary/50"
            />
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Zen Mode Toggle Button */}
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className={cn(
                "flex h-8 items-center gap-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border",
                isZenMode
                  ? "bg-accent/15 text-accent border-accent/25 shadow-sm"
                  : "bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/80 hover:text-foreground"
              )}
              title={isZenMode ? "Keluar Mode Zen" : "Aktifkan Mode Zen"}
            >
              {isZenMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{isZenMode ? "Normal" : "Zen Mode"}</span>
            </button>

            <div className="min-w-[65px] text-right">
              {saveStatus === "saving" && (
                <span className="flex items-center justify-end gap-1 font-mono text-[9px] uppercase font-bold tracking-widest text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Menyimpan
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center justify-end gap-1 font-mono text-[9px] uppercase font-bold tracking-widest text-accent">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent animate-pulse" />
                  Tersimpan
                </span>
              )}
              {saveStatus === "idle" && (
                <span className="flex items-center justify-end gap-1 font-mono text-[9px] uppercase font-bold tracking-widest text-muted-foreground/55">
                  • Siap
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="glass-premium rounded-xl overflow-hidden border border-border/30 shadow-sm">
          <TipTapEditor content={konten} onChange={setKonten} />
        </div>
      </div>

      {/* Sidebar Panel Options */}
      <aside className={cn(
        "space-y-6 lg:sticky lg:top-20 transition-all duration-500 ease-in-out origin-right",
        isZenMode ? "opacity-0 pointer-events-none translate-x-12 w-0 h-0 overflow-hidden" : "opacity-100 w-full"
      )}>
        {rubrikEssay && Object.keys(rubrikEssay).length > 0 && (
          <div className="glass-premium rounded-xl border border-border/30 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-border/10 bg-muted/10 px-4 py-3 text-foreground/80 font-bold">
              <Award className="h-4 w-4 text-primary" />
              <p className="font-mono text-[10px] uppercase tracking-widest">Kriteria Penilaian Esai</p>
            </div>
            <ul className="space-y-3.5 p-4 max-h-[220px] overflow-y-auto pr-2">
              {Object.entries(rubrikEssay).map(([k, v]) => (
                <li key={k} className="border-b border-border/10 last:border-b-0 pb-3 last:pb-0">
                  <p className="font-display text-xs font-bold leading-tight text-foreground capitalize tracking-tightish flex items-center gap-1">
                    <AlignLeft className="h-3 w-3 text-primary" />
                    {k}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed pl-4">{v}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <GuidedQuestionsPanel
          essayId={essayId}
          onDraftGenerated={(draft) => {
            const html = draft
              .split(/\n\n+/)
              .map((p) => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
              .join("");
            setKonten(html);
          }}
        />

        <FeedbackPanel essayId={essayId} initialFeedback={initialFeedback} />
      </aside>
    </div>
  );
}
