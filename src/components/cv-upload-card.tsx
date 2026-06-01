"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ParsedCvData {
  tipe?: "SMA" | "MAHASISWA" | null;
  kelas?: string | null;
  namaSekolah?: string | null;
  nilaiRataRata?: number | null;
  prestasi?: string[];
  ekstrakurikuler?: string[];
  jenjang?: string | null;
  jurusan?: string | null;
  universitas?: string | null;
  ipk?: number | null;
  toefl?: number | null;
  ielts?: number | null;
  pengalaman?: string[];
  publikasi?: string[];
  targetJenjang?: string | null;
  targetNegara?: string[];
  targetBidang?: string[];
  butuhFinansial?: boolean;
  confidence?: "high" | "medium" | "low";
  notes?: string;
}

export function CvUploadCard({
  onParsed,
}: {
  onParsed: (data: ParsedCvData) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    confidence?: string;
    fieldCount: number;
  } | null>(null);

  async function handleFile(file: File) {
    setError("");
    setSuccess(null);
    setFileName(file.name);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await fetch("/api/profile/parse-cv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal parse CV");
        return;
      }
      const parsed: ParsedCvData = data.profile;

      // Count non-null/non-empty fields
      let fieldCount = 0;
      for (const [k, v] of Object.entries(parsed)) {
        if (k === "confidence" || k === "notes") continue;
        if (v == null) continue;
        if (Array.isArray(v) && v.length === 0) continue;
        if (typeof v === "string" && v === "") continue;
        fieldCount++;
      }

      setSuccess({ confidence: parsed.confidence, fieldCount });
      onParsed(parsed);
    } catch (e) {
      setError(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed border-accent/40 bg-accent/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-accent/15 font-mono text-xs font-bold text-primary">
          CV
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            Upload CV — auto-fill profil dengan AI
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Punya CV PDF? Upload aja, Gemini AI akan baca dan isi otomatis form di bawah.
            Kamu masih bisa edit sebelum simpan.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="accent"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              {loading ? "AI sedang membaca CV..." : "Pilih file CV"}
            </Button>
            {fileName && !loading && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {fileName}
              </span>
            )}
            <span className="text-xs text-muted-foreground">PDF / PNG / JPG · maks 10 MB</span>
          </div>

          {error && (
            <div className="mt-3 border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">
                ✓ AI berhasil baca CV
              </span>
              <span className="text-muted-foreground">
                · {success.fieldCount} field auto-filled
              </span>
              {success.confidence && (
                <Badge variant={
                  success.confidence === "high" ? "success" :
                  success.confidence === "medium" ? "warning" : "destructive"
                }>
                  {success.confidence}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
