"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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

export function ScrapedReviewCard({
  scraped,
  onUpdate,
}: {
  scraped: ScrapedScholarship;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draftJson, setDraftJson] = useState(() =>
    JSON.stringify(scraped.normalizedData ?? {}, null, 2)
  );

  const data = scraped.normalizedData as Record<string, unknown> | null;
  const confidence = data?.confidence as string | undefined;

  async function saveEdits() {
    setError("");
    setWorking("save");
    let parsed: unknown;
    try {
      parsed = JSON.parse(draftJson);
    } catch {
      setWorking(null);
      setError("JSON tidak valid");
      return;
    }
    const res = await fetch(`/api/admin/scraping/${scraped.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ normalizedData: parsed }),
    });
    setWorking(null);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Gagal menyimpan");
      return;
    }
    setEditing(false);
    onUpdate();
  }

  async function approve() {
    setError("");
    setWorking("approve");
    const res = await fetch(`/api/admin/scraping/${scraped.id}/approve`, { method: "POST" });
    setWorking(null);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Approve gagal");
      return;
    }
    onUpdate();
  }

  async function reject() {
    if (!confirm("Tolak record ini?")) return;
    setError("");
    setWorking("reject");
    const res = await fetch(`/api/admin/scraping/${scraped.id}/reject`, { method: "POST" });
    setWorking(null);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Reject gagal");
      return;
    }
    onUpdate();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">
              {(data?.nama as string) ?? scraped.rawTitle ?? "(Tanpa nama)"}
            </h3>
            <p className="text-xs text-muted-foreground">
              dari <a href={scraped.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{scraped.sourceName}</a>
              {" · "}
              {new Date(scraped.scrapedAt).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex gap-1.5">
            <StatusBadge status={scraped.status} />
            {confidence && (
              <Badge variant={confidence === "high" ? "success" : confidence === "medium" ? "warning" : "destructive"}>
                {confidence} confidence
              </Badge>
            )}
          </div>
        </div>

        {scraped.errorMessage && (
          <div className="rounded border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {scraped.errorMessage}
          </div>
        )}

        {data && !editing && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Field label="Provider" value={data.provider as string} />
            <Field label="Negara" value={data.negara as string} />
            <Field label="Jenjang" value={(data.jenjang as string[])?.join(", ")} />
            <Field label="Target User" value={(data.targetUser as string[])?.join(", ")} />
            <Field label="Deadline" value={(data.deadline as string) ?? (data.deadlineNote as string) ?? "—"} />
            <Field label="Cakupan" value={(data.cakupan as string[])?.join(", ")} />
          </div>
        )}

        {editing && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Edit JSON normalisasi:</p>
            <Textarea
              value={draftJson}
              onChange={(e) => setDraftJson(e.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {scraped.status === "PENDING_REVIEW" && (
          <div className="flex flex-wrap gap-2 pt-1">
            {editing ? (
              <>
                <Button size="sm" disabled={working === "save"} onClick={saveEdits}>
                  {working === "save" ? "Saving..." : "Simpan"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Batal</Button>
              </>
            ) : (
              <>
                <Button size="sm" disabled={working === "approve"} onClick={approve}>
                  {working === "approve" ? "Approving..." : "✅ Approve"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                <Button size="sm" variant="destructive" disabled={working === "reject"} onClick={reject}>
                  {working === "reject" ? "Rejecting..." : "❌ Reject"}
                </Button>
              </>
            )}
            <a
              href={scraped.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto self-center text-xs text-muted-foreground hover:underline"
            >
              🔗 Lihat sumber
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "APPROVED" ? "success" : status === "REJECTED" ? "destructive" : "warning";
  return <Badge variant={variant}>{status}</Badge>;
}
