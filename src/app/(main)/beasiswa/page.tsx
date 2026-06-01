"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { BeasiswaCard, type BeasiswaCardData } from "@/components/beasiswa-card";
import { FilterSidebar, initialFilters, type FilterState } from "@/components/filter-sidebar";
import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, Grid, ArrowUpDown, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

type View = "all" | "match" | "deadline" | "new" | "scraped";
type Sort = "newest" | "deadline" | "match";
const ALL_VIEWS: View[] = ["all", "match", "deadline", "new", "scraped"];

const VIEW_TABS: { value: View; label: string }[] = [
  { value: "all", label: "Semua Indeks" },
  { value: "match", label: "Cocok Untukmu ✨" },
  { value: "deadline", label: "Deadline Dekat" },
  { value: "new", label: "Baru Ditambah" },
  { value: "scraped", label: "Scraped Verified" },
];

function BeasiswaPageInner() {
  const searchParams = useSearchParams();
  const initialView = ((): View => {
    const v = searchParams.get("view") as View | null;
    return v && ALL_VIEWS.includes(v) ? v : "all";
  })();

  const [view, setView] = useState<View>(initialView);
  const [sort, setSort] = useState<Sort>("newest");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [data, setData] = useState<BeasiswaCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.role === "ADMIN") setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const fetchBeasiswa = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("view", view);
    params.set("sort", sort);
    filters.jenjang.forEach((v) => params.append("jenjang", v));
    filters.targetUser.forEach((v) => params.append("targetUser", v));
    filters.negara.forEach((v) => params.append("negara", v));
    filters.bahasa.forEach((v) => params.append("bahasa", v));
    if (filters.cakupan) params.set("cakupan", filters.cakupan);
    if (filters.ipkMin) params.set("ipkMin", filters.ipkMin);
    if (filters.toeflMin) params.set("toeflMin", filters.toeflMin);
    if (filters.sourceType) params.set("sourceType", filters.sourceType);

    const res = await fetch(`/api/beasiswa?${params.toString()}`);
    const json = await res.json();
    setData(json.beasiswa ?? []);
    setLoading(false);

    if (json.beasiswa?.[0]?.matchScore != null) {
      setHasProfile(true);
    }
  }, [search, view, sort, filters]);

  useEffect(() => {
    const t = setTimeout(fetchBeasiswa, 250);
    return () => clearTimeout(t);
  }, [fetchBeasiswa]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 transition-colors duration-300">
      {/* Editorial Header */}
      <Reveal as="header" className="mb-10 border-b border-border/30 pb-6">
        <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-primary">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Direktori Beasiswa Terverifikasi · Vol. 01
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Jelajahi Peluang Beasiswa<span className="text-primary">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Temukan program pembiayaan dari pemerintah, kampus, atau yayasan swasta. Gunakan pencarian instan dan filter otomatis berbasis profil akademik Anda.
        </p>
      </Reveal>

      {/* Search & Sort Panel */}
      <div className="mb-8 flex flex-col gap-4 border border-border/30 bg-card/40 backdrop-blur-sm p-4 rounded-xl shadow-sm sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari beasiswa berdasarkan nama, provider, negara, atau bidang studi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 border-border/40 focus-visible:ring-primary bg-card/60 !h-11 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center gap-3.5 flex-shrink-0 self-end sm:self-center border-t sm:border-t-0 border-border/20 pt-3 sm:pt-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <span>Urutkan</span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-card border border-border/40 rounded-lg text-xs font-bold uppercase tracking-wider text-foreground px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="deadline">Deadline Terdekat</option>
            {hasProfile && <option value="match">Skor Match AI</option>}
          </select>
        </div>
      </div>

      {/* View tabs bar */}
      <div className="mb-8 flex flex-wrap gap-2 overflow-x-auto border-b border-border/10 pb-4">
        {VIEW_TABS.filter(tab => tab.value !== "scraped" || isAdmin).map((tab) => {
          const isMatch = tab.value === "match";
          const disabled = isMatch && !hasProfile;
          const active = view === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => !disabled && setView(tab.value)}
              disabled={disabled}
              title={disabled ? "Lengkapi profil Anda di onboarding terlebih dahulu" : undefined}
              className={cn(
                "relative rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300",
                active
                  ? "text-primary-foreground font-extrabold"
                  : "text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="activeTabGlow"
                  className="absolute inset-0 rounded-lg bg-primary shadow-md shadow-primary/20 -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Directory Split Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(initialFilters)}
        />

        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse bg-muted rounded-xl border border-border/20" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="border border-dashed border-border/40 rounded-xl p-16 text-center bg-card/20">
              <SlidersHorizontal className="mx-auto h-10 w-10 text-muted-foreground/60 mb-4 animate-pulse" />
              <p className="font-display text-xl font-bold text-foreground">Tidak Ada Hasil Ditemukan</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                Coba bersihkan filter pencarian atau ubah kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                  <Grid className="h-3.5 w-3.5 text-primary" />
                  Menampilkan <span className="text-foreground font-extrabold tabular-nums">{data.length}</span> beasiswa aktif
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((b, i) => (
                  <Reveal key={b.id} delay={Math.min(i * 0.05, 0.4)} className="h-full">
                    <BeasiswaCard b={b} isAdmin={isAdmin} />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BeasiswaPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl border border-border/20 bg-muted" />
            ))}
          </div>
        </div>
      }
    >
      <BeasiswaPageInner />
    </Suspense>
  );
}
