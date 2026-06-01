"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { getProviderLogo } from "@/lib/scholarship-logos";

interface BeasiswaItem {
  id: string;
  nama: string;
  provider: string;
  negara: string;
  jenjang: string[];
  sourceType: string;
  verified: boolean;
  aktif: boolean;
  imageUrl: string | null;
  urlResmi: string | null;
  deadline: string | null;
  updatedAt: string;
}

export default function AdminBeasiswaPage() {
  const [data, setData] = useState<BeasiswaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/beasiswa?search=${encodeURIComponent(search)}`);
    const json = await res.json();
    setData(json.beasiswa ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Nonaktifkan beasiswa "${nama}"? (soft delete — bisa di-restore)`)) return;
    const res = await fetch(`/api/admin/beasiswa/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
    else alert("Gagal menghapus");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 border-b border-border/30 pb-6">
        <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary font-bold">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Admin · Manage
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Kelola <span className="text-gradient">Beasiswa</span>.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Edit, nonaktifkan, atau ubah status verifikasi beasiswa.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          placeholder="Cari nama, provider, negara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {data.length} hasil
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-4 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 shadow-sm transition-all hover:border-primary/40 ${
                !b.aktif ? "opacity-50" : ""
              }`}
            >
              {/* Image */}
              <div className="h-14 w-14 flex-none overflow-hidden rounded-lg bg-muted">
                <SafeImage
                  src={b.imageUrl}
                  fallbackSrcs={[getProviderLogo(b.urlResmi)]}
                  alt={b.nama}
                  fallbackName={b.nama}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  rounded="rounded-lg"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{b.nama}</h3>
                <p className="truncate text-sm text-muted-foreground">
                  {b.provider} · {b.negara} · {b.jenjang.join(", ")}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {b.sourceType === "MANUAL" && <Badge variant="outline">Kurasi</Badge>}
                  {b.sourceType === "SCRAPED" && <Badge variant="secondary">Scraped</Badge>}
                  {b.verified && <Badge variant="default">Verified</Badge>}
                  {!b.aktif && <Badge variant="destructive">Nonaktif</Badge>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-none gap-2">
                <Link href={`/admin/beasiswa/${b.id}/edit`}>
                  <Button size="sm" variant="outline">Edit</Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(b.id, b.nama)}
                  disabled={!b.aktif}
                >
                  {b.aktif ? "Nonaktifkan" : "Nonaktif"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
