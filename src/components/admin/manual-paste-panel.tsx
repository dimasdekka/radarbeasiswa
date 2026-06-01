"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ManualPasteResult {
  success: boolean;
  duplicate?: boolean;
  beasiswaId?: string;
  confidence?: "high" | "medium" | "low";
  autoApproved?: boolean;
  message: string;
}

export function ManualPastePanel({
  autoApprove,
  onSuccess,
}: {
  autoApprove: boolean;
  onSuccess?: () => void;
}) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [rawTitle, setRawTitle] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ManualPasteResult | null>(null);

  async function submit() {
    if (!sourceUrl || !rawContent.trim()) {
      setError("URL dan konten harus diisi");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    const res = await fetch("/api/admin/scraping/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl, sourceName: sourceName || undefined, rawTitle: rawTitle || undefined, rawContent, autoApprove }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal memproses");
      return;
    }
    setResult(data);
    if (data.success) {
      // clear form on real success
      setSourceUrl(""); setSourceName(""); setRawTitle(""); setRawContent("");
      onSuccess?.();
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent font-bold">Manual Paste</p>
          <h2 className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight">
            Paste konten dari browser
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Untuk site yang block bot (LPDP, Kemdikbud, dll) — buka site di browser kamu, copy seluruh konten halaman (Ctrl+A → Ctrl+C), paste di sini. Gemini AI akan ekstrak datanya.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>URL halaman beasiswa *</Label>
            <Input
              type="url"
              placeholder="https://lpdp.kemenkeu.go.id/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nama sumber (opsional)</Label>
            <Input
              placeholder="LPDP Reguler 2026"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Judul halaman (opsional)</Label>
          <Input
            placeholder="Beasiswa Reguler LPDP Tahap 1 2026"
            value={rawTitle}
            onChange={(e) => setRawTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Konten halaman *</Label>
          <Textarea
            rows={10}
            placeholder="Paste seluruh teks halaman beasiswa di sini... Minimal 100 karakter. Pastikan info penting (nama, deadline, syarat, cakupan) tersalin."
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            {rawContent.length} karakter
            {rawContent.length > 0 && rawContent.length < 100 && (
              <span className="ml-2 text-destructive">(minimal 100)</span>
            )}
          </p>
        </div>

        {error && (
          <div className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        {result && (
          <div className={`rounded-lg border-l-2 px-3 py-3 ${
            result.success && !result.duplicate ? "border-accent bg-accent/5" :
            result.duplicate ? "border-amber-500 bg-amber-500/10" :
            "border-destructive bg-destructive/5"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">{result.message}</p>
              <div className="flex flex-none gap-1">
                {result.confidence && (
                  <Badge variant={result.confidence === "high" ? "success" : result.confidence === "medium" ? "warning" : "destructive"}>
                    {result.confidence}
                  </Badge>
                )}
                {result.autoApproved && <Badge variant="accent">Auto-approved</Badge>}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={submit}
          disabled={loading || !sourceUrl || rawContent.trim().length < 100}
          size="lg"
          className="w-full"
        >
          {loading ? "Gemini sedang menganalisa..." : "Extract dengan AI →"}
        </Button>
      </CardContent>
    </Card>
  );
}
