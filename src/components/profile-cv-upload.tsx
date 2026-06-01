"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProfileCvUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ confidence?: string; fieldCount: number } | null>(null);

  async function handleFile(file: File) {
    setError("");
    setSuccess(null);
    setFileName(file.name);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await fetch("/api/profile/parse-cv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal parse CV"); return; }

      // Save parsed data to profile
      const saveRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.profile),
      });
      if (!saveRes.ok) { setError("Gagal menyimpan data profil"); return; }

      let fieldCount = 0;
      for (const [k, v] of Object.entries(data.profile)) {
        if (k === "confidence" || k === "notes") continue;
        if (v == null || (Array.isArray(v) && v.length === 0) || v === "") continue;
        fieldCount++;
      }
      setSuccess({ confidence: data.profile.confidence, fieldCount });
      router.refresh();
    } catch (e) {
      setError(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
          CV
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold">Upload CV — update profil otomatis</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload CV PDF terbaru, AI akan baca dan update data profilmu secara otomatis.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? "AI membaca CV..." : "Pilih file CV"}
            </Button>
            {fileName && !loading && (
              <span className="truncate max-w-[180px] text-xs text-muted-foreground">{fileName}</span>
            )}
            <span className="text-xs text-muted-foreground">PDF / PNG / JPG · maks 10 MB</span>
          </div>
          {error && (
            <div className="mt-3 rounded-md border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border-l-2 border-accent bg-accent/5 px-3 py-2 text-sm">
              <span className="font-medium">✓ Profil diperbarui dari CV</span>
              <span className="text-muted-foreground">· {success.fieldCount} field updated</span>
              {success.confidence && (
                <Badge variant={success.confidence === "high" ? "default" : "secondary"}>
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
