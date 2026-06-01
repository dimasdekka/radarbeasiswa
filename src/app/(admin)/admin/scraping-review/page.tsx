"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrapedReviewCard } from "@/components/admin/scraped-review-card";
import { ManualPastePanel } from "@/components/admin/manual-paste-panel";
import { AiResearchPanel } from "@/components/admin/ai-research-panel";
import { cn } from "@/lib/utils";
import {
  Bot,
  ClipboardPaste,
  Play,
  Loader2,
  Link2,
  CheckCircle2,
  Clock,
  Copy,
  XCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
  schedule: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
}

interface ScrapedScholarship {
  id: string;
  sourceName: string;
  sourceUrl: string;
  rawTitle: string | null;
  normalizedData: unknown;
  status: string;
  errorMessage: string | null;
  scrapedAt: string;
}

type RunStatus = "scraped" | "auto-approved" | "duplicate" | "failed" | "rate-limited";

interface RunTally {
  total: number;
  done: number;
  scraped: number;
  autoApproved: number;
  duplicate: number;
  failed: number;
  rateLimited: number;
  current: string | null;
}

const STATUS_TABS = [
  { value: "PENDING_REVIEW", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const emptyTally: RunTally = {
  total: 0, done: 0, scraped: 0, autoApproved: 0, duplicate: 0, failed: 0, rateLimited: 0, current: null,
};

export default function ScrapingReviewPage() {
  const [activeTab, setActiveTab] = useState("PENDING_REVIEW");
  const [scraped, setScraped] = useState<ScrapedScholarship[]>([]);
  const [sources, setSources] = useState<ScrapingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [adhocUrl, setAdhocUrl] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [error, setError] = useState("");
  const [tally, setTally] = useState<RunTally | null>(null);
  const [mode, setMode] = useState<"research" | "auto" | "manual">("research");

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/scraping?status=${activeTab}`);
    const data = await res.json();
    if (res.ok) {
      setScraped(data.scraped ?? []);
      setSources(data.sources ?? []);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function runOneSource(sourceId: string): Promise<RunStatus | null> {
    const res = await fetch("/api/admin/scraping/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, autoApprove }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Scraping gagal");
      return null;
    }
    return data.status as RunStatus;
  }

  function applyStatusToTally(status: RunStatus | null, sourceName: string | null) {
    setTally((prev) => {
      const base = prev ?? { ...emptyTally };
      const next: RunTally = { ...base, done: base.done + 1, current: sourceName };
      if (status === "scraped") next.scraped++;
      else if (status === "auto-approved") next.autoApproved++;
      else if (status === "duplicate") next.duplicate++;
      else if (status === "rate-limited") next.rateLimited++;
      else next.failed++;
      return next;
    });
  }

  async function runForSource(sourceId: string, sourceName: string) {
    setError("");
    setTally(null);
    setRunning(sourceId);
    const status = await runOneSource(sourceId);
    setRunning(null);
    if (status) {
      setTally({ ...emptyTally, total: 1, done: 1, current: sourceName, [statusKey(status)]: 1 } as RunTally);
    }
    refresh();
  }

  // Client-side sequential run — live progress, no giant blocking request,
  // resilient to Cloud Run request timeouts.
  async function runAll() {
    const active = sources.filter((s) => s.active);
    if (active.length === 0) return;
    if (!confirm(`Jalankan scraping untuk ${active.length} sumber aktif secara berurutan? Bisa makan waktu beberapa menit.`)) return;

    setError("");
    setRunning("all");
    setTally({ ...emptyTally, total: active.length, current: active[0]?.name ?? null });

    for (let i = 0; i < active.length; i++) {
      const s = active[i];
      setTally((prev) => (prev ? { ...prev, current: s.name } : prev));
      const status = await runOneSource(s.id);
      applyStatusToTally(status, i + 1 < active.length ? active[i + 1].name : null);
      // brief refresh of the list as results land
      if (i % 3 === 2) refresh();
    }

    setRunning(null);
    refresh();
  }

  async function runAdhoc() {
    if (!adhocUrl) return;
    setError("");
    setTally(null);
    setRunning("adhoc");
    const res = await fetch("/api/admin/scraping/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: adhocUrl, autoApprove }),
    });
    const data = await res.json();
    setRunning(null);
    if (!res.ok) setError(data.error ?? "Scraping gagal");
    else {
      setAdhocUrl("");
      setTally({ ...emptyTally, total: 1, done: 1, [statusKey(data.status)]: 1 } as RunTally);
    }
    refresh();
  }

  const activeSourcesCount = sources.filter((s) => s.active).length;
  const progressPct = tally && tally.total > 0 ? Math.round((tally.done / tally.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <header className="mb-8 border-b border-border/30 pb-6">
        <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary font-bold">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Admin · Scraping Review
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Review hasil <span className="text-gradient">scraping</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Approve hasil yang baik, reject duplikat. Beasiswa yang di-approve langsung tampil di{" "}
          <span className="font-mono text-foreground">/beasiswa</span> untuk semua user.
        </p>
      </header>

      {/* Mode toggle */}
      <div className="mb-6 inline-flex rounded-xl border border-border/40 bg-card/50 p-1 backdrop-blur-sm">
        <button
          onClick={() => setMode("research")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
            mode === "research" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> AI Research
        </button>
        <button
          onClick={() => setMode("auto")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
            mode === "auto" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bot className="h-3.5 w-3.5" /> Auto Scrape
        </button>
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
            mode === "manual" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardPaste className="h-3.5 w-3.5" /> Manual Paste
        </button>
      </div>

      {/* AI RESEARCH MODE */}
      {mode === "research" && (
        <>
          <label className="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
            <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} className="h-4 w-4 accent-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Auto-approve confidence:high</p>
              <p className="text-xs text-muted-foreground">Hasil high-confidence langsung publish ke /beasiswa.</p>
            </div>
            <Badge variant={autoApprove ? "success" : "outline"}>{autoApprove ? "ON" : "OFF"}</Badge>
          </label>
          <AiResearchPanel autoApprove={autoApprove} onDone={refresh} />
        </>
      )}

      {/* AUTO MODE */}
      {mode === "auto" && (
        <>
          {/* Run panel */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-accent font-bold">Otomatisasi</p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Jalankan scraping</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Run semua {activeSourcesCount} sumber aktif berurutan, atau pilih per sumber di bawah.
                  </p>
                </div>
              </div>

              {/* Auto-approve toggle */}
              <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Auto-approve confidence:high</p>
                  <p className="text-xs text-muted-foreground">
                    Hasil yang Gemini nilai &quot;high confidence&quot; langsung publish ke /beasiswa tanpa review manual.
                  </p>
                </div>
                <Badge variant={autoApprove ? "success" : "outline"}>{autoApprove ? "ON" : "OFF"}</Badge>
              </label>

              {/* Run all */}
              <Button
                variant="default"
                size="lg"
                disabled={running !== null || activeSourcesCount === 0}
                onClick={runAll}
                className="w-full"
              >
                {running === "all" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sedang run {activeSourcesCount} sumber...</>
                ) : (
                  <><Play className="h-4 w-4" /> Run all sources ({activeSourcesCount})</>
                )}
              </Button>

              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Atau scrape URL ad-hoc..."
                    value={adhocUrl}
                    onChange={(e) => setAdhocUrl(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={runAdhoc} disabled={!adhocUrl || running !== null}>
                  {running === "adhoc" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run URL"}
                </Button>
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 flex-none" />
                  {error}
                </div>
              )}

              {/* Live progress */}
              {tally && (
                <div className="mt-5 rounded-xl border border-border/40 bg-muted/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                      Progres · {tally.done}/{tally.total}
                    </p>
                    {running && tally.current && (
                      <p className="flex items-center gap-1.5 truncate font-mono text-[11px] text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" /> {tally.current}
                      </p>
                    )}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <TallyCell icon={Clock} label="Pending" value={tally.scraped} />
                    <TallyCell icon={CheckCircle2} label="Auto-approved" value={tally.autoApproved} tone="success" />
                    <TallyCell icon={Copy} label="Duplicate" value={tally.duplicate} />
                    <TallyCell
                      icon={tally.rateLimited > 0 ? AlertTriangle : XCircle}
                      label={tally.rateLimited > 0 ? "Rate-limited" : "Failed"}
                      value={tally.rateLimited > 0 ? tally.rateLimited : tally.failed}
                      tone={tally.rateLimited > 0 ? "warning" : "destructive"}
                    />
                  </div>
                  {tally.rateLimited > 0 && (
                    <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                      {tally.rateLimited} sumber kena rate-limit Gemini — ini transient, akan otomatis dicoba lagi di run berikutnya.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sources list */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                {activeSourcesCount} sumber aktif
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sources.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/10 p-4 transition-all hover:border-border/70",
                      !s.active && "opacity-50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                        {s.schedule && <Badge variant="outline">{s.schedule.toLowerCase()}</Badge>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{s.url}</p>
                      {s.lastStatus && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider">
                          <span className="text-muted-foreground">Last: </span>
                          <span
                            className={cn(
                              s.lastStatus.startsWith("FAILED")
                                ? "text-destructive"
                                : s.lastStatus.startsWith("RATE_LIMITED")
                                ? "text-amber-600 dark:text-amber-400"
                                : s.lastStatus === "AUTO_APPROVED"
                                ? "text-accent"
                                : "text-foreground"
                            )}
                          >
                            {s.lastStatus}
                          </span>
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={running !== null || !s.active}
                      onClick={() => runForSource(s.id, s.name)}
                    >
                      {running === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Run"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* MANUAL MODE */}
      {mode === "manual" && (
        <>
          <label className="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3.5 transition-all hover:bg-muted/30">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Auto-approve confidence:high</p>
              <p className="text-xs text-muted-foreground">
                Hasil yang Gemini nilai &quot;high confidence&quot; langsung publish ke /beasiswa.
              </p>
            </div>
            <Badge variant={autoApprove ? "success" : "outline"}>{autoApprove ? "ON" : "OFF"}</Badge>
          </label>

          <ManualPastePanel autoApprove={autoApprove} onSuccess={refresh} />
        </>
      )}

      {/* Status tabs */}
      <div className="mb-6 mt-8 flex gap-1 border-b border-border/30">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border/20 bg-muted/30" />
          ))}
        </div>
      ) : scraped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-16 text-center">
          <p className="font-display text-2xl font-bold tracking-tight">Tidak ada record {activeTab}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTab === "PENDING_REVIEW" ? 'Klik "Run all sources" untuk mulai scraping' : "—"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
            {scraped.length} record
          </p>
          {scraped.map((s) => (
            <ScrapedReviewCard key={s.id} scraped={s} onUpdate={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function statusKey(status: RunStatus): keyof RunTally {
  switch (status) {
    case "scraped": return "scraped";
    case "auto-approved": return "autoApproved";
    case "duplicate": return "duplicate";
    case "rate-limited": return "rateLimited";
    default: return "failed";
  }
}

function TallyCell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "success" | "warning" | "destructive";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-card/50 p-3",
        tone === "success" && "border-accent/30 bg-accent/5",
        tone === "warning" && "border-amber-500/30 bg-amber-500/5",
        tone === "destructive" && value > 0 && "border-destructive/30 bg-destructive/5"
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground",
            tone === "success" && "text-accent",
            tone === "warning" && "text-amber-500",
            tone === "destructive" && value > 0 && "text-destructive"
          )}
        />
        <span className="font-display text-2xl font-bold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
