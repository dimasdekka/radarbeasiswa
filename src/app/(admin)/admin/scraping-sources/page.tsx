"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
  schedule: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: "OFFICIAL", label: "Pemerintah" },
  { value: "CAMPUS", label: "Kampus" },
  { value: "PROVIDER", label: "Foundation/Perusahaan" },
];

const SCHEDULE_OPTIONS = ["DAILY", "WEEKLY", "MONTHLY"];

const emptyForm = { name: "", url: "", type: "OFFICIAL", schedule: "MONTHLY" };

export default function ScrapingSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sources");
    const data = await res.json();
    if (res.ok) setSources(data.sources ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function addSource() {
    setError("");
    setWorking("add");
    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setWorking(null);
    if (!res.ok) { setError(data.error ?? "Gagal menambah"); return; }
    setForm(emptyForm);
    setShowAdd(false);
    refresh();
  }

  async function saveEdit(id: string) {
    setError("");
    setWorking(id);
    const res = await fetch(`/api/admin/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setWorking(null);
    if (!res.ok) { setError(data.error ?? "Gagal menyimpan"); return; }
    setEditing(null);
    setForm(emptyForm);
    refresh();
  }

  async function toggleActive(s: Source) {
    setWorking(s.id);
    await fetch(`/api/admin/sources/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    setWorking(null);
    refresh();
  }

  async function deleteSource(s: Source) {
    if (!confirm(`Hapus sumber "${s.name}"?`)) return;
    setWorking(s.id);
    await fetch(`/api/admin/sources/${s.id}`, { method: "DELETE" });
    setWorking(null);
    refresh();
  }

  function startEdit(s: Source) {
    setEditing(s.id);
    setForm({ name: s.name, url: s.url, type: s.type, schedule: s.schedule ?? "MONTHLY" });
  }

  const activeCount = sources.filter((s) => s.active).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 border-b border-border/30 pb-6">
        <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary font-bold">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Admin · Sumber scraping
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Kelola sumber <span className="text-gradient">scraping</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Tambah, edit, atau matikan website beasiswa yang akan di-scrape otomatis. Pilih situs yang HTML-nya stabil (bukan JavaScript-heavy SPA) untuk hasil terbaik.
        </p>
      </header>

      {/* Stats + Add button */}
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="font-bold text-accent tabular-nums">{activeCount}</span> aktif ·{" "}
            <span className="font-bold text-foreground tabular-nums">{sources.length - activeCount}</span> non-aktif
          </p>
        </div>
        <Button onClick={() => { setShowAdd(!showAdd); setForm(emptyForm); setEditing(null); }}>
          {showAdd ? "Batal" : "+ Tambah sumber"}
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="mb-6">
          <CardContent className="space-y-4 p-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Tambah sumber baru</p>
            <SourceFormFields form={form} setForm={setForm} />
            {error && (
              <div className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            <div className="flex gap-2">
              <Button onClick={addSource} disabled={working === "add" || !form.name || !form.url}>
                {working === "add" ? "Menambah..." : "Tambah"}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border/20 bg-muted/30" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-16 text-center">
          <p className="font-display text-2xl font-bold tracking-tight">Belum ada sumber</p>
          <p className="mt-2 text-sm text-muted-foreground">Klik &quot;Tambah sumber&quot; untuk mulai.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((s) => (
            <Card key={s.id} className={cn(!s.active && "opacity-50")}>
              <CardContent className="p-4">
                {editing === s.id ? (
                  <div className="space-y-3">
                    <SourceFormFields form={form} setForm={setForm} />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(s.id)} disabled={working === s.id}>
                        {working === s.id ? "..." : "Simpan"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(emptyForm); }}>
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-bold leading-tight tracking-tight">{s.name}</p>
                        <Badge variant={s.type === "OFFICIAL" ? "default" : s.type === "CAMPUS" ? "secondary" : "outline"}>
                          {TYPE_OPTIONS.find((t) => t.value === s.type)?.label ?? s.type}
                        </Badge>
                        {s.schedule && <Badge variant="outline">{s.schedule.toLowerCase()}</Badge>}
                        {!s.active && <Badge variant="warning">Non-aktif</Badge>}
                      </div>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-muted-foreground hover:text-primary">
                        {s.url} ↗
                      </a>
                      {s.lastStatus && (
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          Last:{" "}
                          <span className={cn(
                            s.lastStatus.startsWith("FAILED") ? "text-destructive" :
                            s.lastStatus.startsWith("RATE_LIMITED") ? "text-amber-600 dark:text-amber-400" :
                            s.lastStatus === "AUTO_APPROVED" ? "text-accent" : "text-foreground"
                          )}>{s.lastStatus}</span>
                          {s.lastRunAt && <span className="text-muted-foreground"> · {new Date(s.lastRunAt).toLocaleString("id-ID")}</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant={s.active ? "outline" : "default"} onClick={() => toggleActive(s)} disabled={working === s.id}>
                        {s.active ? "Matikan" : "Aktifkan"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(s)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteSource(s)} disabled={working === s.id}>
                        Hapus
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceFormFields({
  form,
  setForm,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Nama sumber</Label>
        <Input
          placeholder="Contoh: Beasiswa BCA Finance"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>URL halaman beasiswa</Label>
        <Input
          placeholder="https://..."
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tipe</Label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="flex h-11 w-full rounded-lg border border-border/50 bg-card/60 px-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Schedule</Label>
          <select
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
            className="flex h-11 w-full rounded-lg border border-border/50 bg-card/60 px-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {SCHEDULE_OPTIONS.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
          </select>
        </div>
      </div>
    </>
  );
}
