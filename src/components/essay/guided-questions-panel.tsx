"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, AlertCircle, HelpCircle, Loader2, Sparkles, Wand2 } from "lucide-react";

export interface GuidedQuestion {
  id: string;
  question: string;
  hint: string;
}

export function GuidedQuestionsPanel({
  essayId,
  onDraftGenerated,
}: {
  essayId: string;
  onDraftGenerated: (draft: string) => void;
}) {
  const [questions, setQuestions] = useState<GuidedQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQ, setLoadingQ] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadQuestions() {
    setError("");
    setLoadingQ(true);
    try {
      const res = await fetch(`/api/essays/${essayId}/questions`, { method: "POST" });
      const data = await res.json();
      setLoadingQ(false);
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat daftar pertanyaan");
        return;
      }
      setQuestions(data.questions);
      const init: Record<string, string> = {};
      for (const q of data.questions as GuidedQuestion[]) init[q.id] = "";
      setAnswers(init);
    } catch {
      setError("Kesalahan koneksi saat memuat pertanyaan");
      setLoadingQ(false);
    }
  }

  async function generateDraft() {
    if (!questions) return;
    const filled = questions.filter((q) => answers[q.id]?.trim().length > 0);
    if (filled.length < 2) {
      setError("Jawab minimal 2 pertanyaan terlebih dahulu agar AI memahami garis besar esai Anda.");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const res = await fetch(`/api/essays/${essayId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: filled.map((q) => ({ question: q.question, answer: answers[q.id] })),
        }),
      });
      const data = await res.json();
      setGenerating(false);
      if (!res.ok) { 
        setError(data.error ?? "Gagal memproses draf esai"); 
        return; 
      }
      onDraftGenerated(data.draft as string);
    } catch {
      setError("Kesalahan koneksi saat menyusun draf esai");
      setGenerating(false);
    }
  }

  return (
    <div className="glass-premium rounded-xl border border-border/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/10 bg-muted/10 px-4 py-3">
        <div className="flex items-center gap-1.5 text-foreground/80 font-bold">
          <BookOpen className="h-4 w-4 text-primary" />
          <p className="font-mono text-[10px] uppercase tracking-widest">Pertanyaan Terpandu</p>
        </div>
        {!questions && (
          <Button 
            size="sm" 
            onClick={loadQuestions} 
            disabled={loadingQ}
            className="h-7 text-[10px] font-bold uppercase tracking-wider px-3 rounded-lg"
          >
            {loadingQ ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {loadingQ ? "Memuat..." : "Mulai"}
          </Button>
        )}
      </div>

      <div className="p-4">
        {!questions && !loadingQ && (
          <div className="text-center py-4 space-y-2">
            <HelpCircle className="h-8 w-8 text-muted-foreground/60 mx-auto animate-pulse" />
            <p className="text-xs text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
              Klik <strong>Mulai</strong> untuk mendapatkan serangkaian pertanyaan panduan berdasarkan rubrik beasiswa.
            </p>
          </div>
        )}

        {loadingQ && (
          <div className="space-y-3 py-2 flex flex-col items-center justify-center min-h-[120px]">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Menyiapkan Panduan Pertanyaan...</p>
          </div>
        )}

        {questions && (
          <div className="space-y-5">
            <div className="rounded-lg bg-primary/5 p-3.5 border border-primary/10 text-xs text-muted-foreground leading-relaxed">
              👉 Jawab pertanyaan di bawah secara singkat dengan kata-kata sendiri. AI akan merakit jawaban Anda menjadi draf esai terstruktur sesuai rubrik penilaian.
            </div>

            {questions.map((q, i) => (
              <div key={q.id} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] font-black text-primary/40 tabular-nums w-5 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Label className="normal-case tracking-tight font-bold text-xs text-foreground leading-normal">
                    {q.question}
                  </Label>
                </div>
                
                {q.hint && (
                  <p className="ml-7 text-[10px] text-accent font-semibold flex items-start gap-1">
                    <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0 animate-pulse" />
                    <span>Tips: {q.hint}</span>
                  </p>
                )}
                
                <Textarea
                  rows={3}
                  className="ml-7 w-[calc(100%-1.75rem)] text-xs font-medium rounded-lg border-border/40 focus-visible:ring-primary bg-card/60"
                  placeholder="Ketik jawaban Anda di sini..."
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              </div>
            ))}

            {error && (
              <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-3 flex items-start gap-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <Button 
              onClick={generateDraft} 
              disabled={generating} 
              className="w-full text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/20 h-11 rounded-lg"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  AI sedang merakit esai...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Rakit Draf Esai AI
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
