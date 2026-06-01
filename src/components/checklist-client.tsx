"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChecklistItem = { ready: boolean; updatedAt: string };
export type ChecklistMap = Record<string, ChecklistItem>;

export function ChecklistClient({
  applicationId,
  initialChecklist,
}: {
  applicationId: string;
  initialChecklist: ChecklistMap;
}) {
  const [checklist, setChecklist] = useState<ChecklistMap>(initialChecklist);
  const [newDoc, setNewDoc] = useState("");
  const [saving, setSaving] = useState(false);

  const totalDocs = Object.keys(checklist).length;
  const readyDocs = Object.values(checklist).filter((c) => c.ready).length;
  const progress = totalDocs > 0 ? Math.round((readyDocs / totalDocs) * 100) : 0;

  async function persist(next: ChecklistMap) {
    setSaving(true);
    await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: next }),
    });
    setSaving(false);
  }

  function toggle(name: string) {
    const next = { ...checklist, [name]: { ready: !checklist[name].ready, updatedAt: new Date().toISOString() } };
    setChecklist(next); persist(next);
  }

  function addDoc() {
    const name = newDoc.trim();
    if (!name || checklist[name]) return;
    const next = { ...checklist, [name]: { ready: false, updatedAt: new Date().toISOString() } };
    setChecklist(next); setNewDoc(""); persist(next);
  }

  function removeDoc(name: string) {
    const next = { ...checklist };
    delete next[name];
    setChecklist(next); persist(next);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main column - list */}
      <div className="space-y-6">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-accent font-bold">Checklist dokumen</p>
          {totalDocs === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/40 bg-card/20 p-12 text-center">
              <p className="font-display text-2xl font-bold tracking-tight">Belum ada dokumen</p>
              <p className="mt-1 text-sm text-muted-foreground">Tambahkan dokumen yang perlu disiapkan di kanan.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/20 overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
              {Object.entries(checklist).map(([name, item], i) => (
                <li
                  key={name}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/20"
                >
                  <span className="w-5 font-mono text-[11px] uppercase tracking-widest tabular text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="checkbox"
                    checked={item.ready}
                    onChange={() => toggle(name)}
                    className="h-4 w-4 accent-accent cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={cn(
                      "font-display text-base font-semibold leading-tight tracking-tight",
                      item.ready ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {name}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      {item.ready ? "Siap" : "Belum siap"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDoc(name)}
                    className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/50 transition-colors hover:text-destructive cursor-pointer"
                    title="Hapus"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        {/* Progress card */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="border-b border-border/30 px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent font-bold">Progress</p>
          </div>
          <div className="p-5">
            <div className="font-display text-6xl font-bold leading-none tracking-tight tabular text-foreground">
              {progress}<span className="text-2xl text-muted-foreground">%</span>
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="tabular text-foreground">{readyDocs}</span> dari <span className="tabular text-foreground">{totalDocs}</span> siap
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Add new */}
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="border-b border-border/30 px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent font-bold">Tambah dokumen</p>
          </div>
          <div className="p-4">
            <Input
              placeholder="Surat keterangan kesehatan..."
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDoc(); } }}
            />
            <Button onClick={addDoc} disabled={!newDoc.trim()} className="mt-2 w-full" size="sm">
              + Tambah
            </Button>
            {saving && <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Menyimpan...</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
