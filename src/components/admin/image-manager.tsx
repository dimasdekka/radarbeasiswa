"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, Check, ImageOff } from "lucide-react";

/**
 * Admin image manager: live preview + URL input + AI/scrape auto-find.
 * `beasiswaId` enables the "auto-find" scan of the official URL.
 */
export function ImageManager({
  value,
  onChange,
  beasiswaId,
  name,
}: {
  value: string;
  onChange: (url: string) => void;
  beasiswaId?: string;
  name: string;
}) {
  const [scanning, setScanning] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function autoFind() {
    if (!beasiswaId) return;
    setError("");
    setScanning(true);
    setCandidates([]);
    try {
      const res = await fetch(`/api/admin/beasiswa/${beasiswaId}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mencari gambar");
        return;
      }
      const found: string[] = data.candidates ?? [];
      if (found.length === 0) setError("Tidak ada gambar ditemukan di halaman resmi.");
      setCandidates(found);
      if (data.ogImage) onChange(data.ogImage); // auto-pick the share image
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-none overflow-hidden rounded-xl border border-border bg-muted">
          <SafeImage src={value} alt={name} fallbackName={name} width={80} height={80} className="h-full w-full object-cover" rounded="rounded-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Preview gambar card</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {value ? "Gambar aktif. Kosongkan untuk pakai inisial otomatis." : "Belum ada gambar — card pakai inisial + gradient."}
          </p>
        </div>
        {value && (
          <Button type="button" size="sm" variant="outline" onClick={() => onChange("")}>
            <ImageOff className="h-3.5 w-3.5" /> Hapus
          </Button>
        )}
      </div>

      {/* URL input */}
      <div>
        <Label>Image URL</Label>
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... (logo/banner)"
          className="mt-1"
        />
      </div>

      {/* Auto-find */}
      {beasiswaId && (
        <div>
          <Button type="button" variant="accent" size="sm" onClick={autoFind} disabled={scanning}>
            {scanning ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memindai halaman resmi...</> : <><Sparkles className="h-3.5 w-3.5" /> Cari gambar otomatis</>}
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Memindai URL resmi beasiswa untuk og:image / logo. Pilih salah satu di bawah.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {candidates.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {candidates.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => onChange(url)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                value === url ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              )}
              title={url}
            >
              <SafeImage src={url} alt="kandidat" fallbackName={name} width={120} height={120} className="h-full w-full object-cover" rounded="rounded-md" />
              {value === url && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
