"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Search, AlertTriangle } from "lucide-react";

interface ResearchResponse {
  discovered: number;
  scraped?: number;
  summary: string;
  summaryCounts?: {
    scraped: number;
    autoApproved: number;
    duplicate: number;
    failed: number;
    rateLimited: number;
  };
}

export function AiResearchPanel({
  autoApprove,
  onDone,
}: {
  autoApprove: boolean;
  onDone?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResearchResponse | null>(null);

  async function run() {
    setError("");
    setResult(null);
    setRunning(true);
    try {
      const res = await fetch("/api/admin/scraping/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query || undefined, autoApprove, scrape: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "AI research gagal");
        return;
      }
      setResult(data);
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-accent">AI Auto-Research</p>
            <h2 className="font-display text-2xl font-bold tracking-tight">Cari beasiswa otomatis lewat Google</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gemini melakukan pencarian Google sungguhan, menemukan halaman beasiswa nyata, lalu
              otomatis scrape &amp; normalisasi ke daftar review di bawah.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Topik pencarian (opsional) — mis. 'beasiswa S2 Jepang 2026'"
              className="pl-9"
              onKeyDown={(e) => { if (e.key === "Enter" && !running) run(); }}
            />
          </div>
          <Button onClick={run} disabled={running} size="lg">
            {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Meneliti &amp; scraping...</> : <><Sparkles className="h-4 w-4" /> Mulai Research</>}
          </Button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Kosongkan topik untuk pencarian default (beasiswa terbaru untuk pelajar Indonesia). Proses bisa makan 1-3 menit.
        </p>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-none" /> {error}
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{result.discovered} ditemukan</Badge>
              {result.scraped != null && <Badge variant="secondary">{result.scraped} di-scrape</Badge>}
              {result.summaryCounts && (
                <>
                  <Badge variant="success">{result.summaryCounts.scraped + result.summaryCounts.autoApproved} masuk review</Badge>
                  {result.summaryCounts.duplicate > 0 && <Badge variant="outline">{result.summaryCounts.duplicate} duplikat</Badge>}
                  {result.summaryCounts.rateLimited > 0 && <Badge variant="warning">{result.summaryCounts.rateLimited} rate-limited</Badge>}
                  {result.summaryCounts.failed > 0 && <Badge variant="destructive">{result.summaryCounts.failed} gagal</Badge>}
                </>
              )}
            </div>
            {result.summary && (
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{result.summary}</p>
            )}
            <p className="text-xs text-muted-foreground">Cek tab Pending di bawah untuk review hasilnya.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
