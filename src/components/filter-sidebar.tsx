"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ListFilter, RefreshCw, GraduationCap, Globe, Shield, BookOpen, Languages, Award, LucideIcon } from "lucide-react";

const JENJANG_OPTIONS = ["S1", "S2", "S3"];
const TARGET_USER_OPTIONS = [
  { value: "SMA", label: "SMA" },
  { value: "MAHASISWA", label: "Mahasiswa" },
];
const NEGARA_OPTIONS = [
  "Indonesia", "Singapura", "Korea Selatan", "Jepang", "Inggris",
  "Australia", "Amerika Serikat", "Jerman", "Hungaria", "Belgia",
  "Eropa (Multi-negara)",
];
const BAHASA_OPTIONS = ["Indonesia", "Inggris", "Jepang", "Jerman", "Hungaria"];

export interface FilterState {
  jenjang: string[];
  targetUser: string[];
  negara: string[];
  bahasa: string[];
  cakupan: string;
  ipkMin: string;
  toeflMin: string;
  sourceType: string;
}

export const initialFilters: FilterState = {
  jenjang: [],
  targetUser: [],
  negara: [],
  bahasa: [],
  cakupan: "",
  ipkMin: "",
  toeflMin: "",
  sourceType: "",
};

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border/40 text-muted-foreground bg-muted/10 hover:border-border/80 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Group({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t border-border/20 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-1.5 text-foreground/80 font-bold">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <Label className="text-xs uppercase tracking-wider font-bold cursor-default">{label}</Label>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

export function FilterSidebar({
  filters,
  onChange,
  onReset,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}) {
  const activeCount =
    filters.jenjang.length + filters.targetUser.length + filters.negara.length + filters.bahasa.length +
    (filters.cakupan ? 1 : 0) + (filters.ipkMin ? 1 : 0) + (filters.toeflMin ? 1 : 0) + (filters.sourceType ? 1 : 0);

  return (
    <aside className="glass-premium rounded-xl p-5 border border-border/30 shadow-sm space-y-6 self-start">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/20 pb-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-display text-sm font-extrabold uppercase tracking-widest text-foreground">
            Filter Pencarian
          </h3>
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
          >
            <RefreshCw className="h-3 w-3 animate-spin-hover" />
            Reset ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-5">
        <Group label="Jenjang Studi" icon={GraduationCap}>
          <div className="flex flex-wrap gap-1.5">
            {JENJANG_OPTIONS.map((j) => (
              <Chip key={j} active={filters.jenjang.includes(j)} onClick={() => onChange({ ...filters, jenjang: toggleArr(filters.jenjang, j) })}>
                {j}
              </Chip>
            ))}
          </div>
        </Group>

        <Group label="Target Pengguna" icon={GraduationCap}>
          <div className="flex flex-wrap gap-1.5">
            {TARGET_USER_OPTIONS.map((t) => (
              <Chip key={t.value} active={filters.targetUser.includes(t.value)} onClick={() => onChange({ ...filters, targetUser: toggleArr(filters.targetUser, t.value) })}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Group>

        <Group label="Negara Tujuan" icon={Globe}>
          <div className="flex flex-wrap gap-1.5">
            {NEGARA_OPTIONS.map((n) => (
              <Chip key={n} active={filters.negara.includes(n)} onClick={() => onChange({ ...filters, negara: toggleArr(filters.negara, n) })}>
                {n}
              </Chip>
            ))}
          </div>
        </Group>

        <Group label="Cakupan Pendanaan" icon={Award}>
          <select
            value={filters.cakupan}
            onChange={(e) => onChange({ ...filters, cakupan: e.target.value })}
            className="flex h-9 w-full rounded-lg border border-border/40 bg-card px-2.5 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          >
            <option value="">Semua Cakupan</option>
            <option value="full">Full Funded</option>
          </select>
        </Group>

        <Group label="Bahasa Pengantar" icon={Languages}>
          <div className="flex flex-wrap gap-1.5">
            {BAHASA_OPTIONS.map((b) => (
              <Chip key={b} active={filters.bahasa.includes(b)} onClick={() => onChange({ ...filters, bahasa: toggleArr(filters.bahasa, b) })}>
                {b}
              </Chip>
            ))}
          </div>
        </Group>

        <Group label="Maks. IPK Minimum" icon={BookOpen}>
          <Input
            type="number" step="0.01" min="0" max="4"
            placeholder="Contoh: 3.0"
            value={filters.ipkMin}
            onChange={(e) => onChange({ ...filters, ipkMin: e.target.value })}
            className="h-9 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card text-foreground"
          />
        </Group>

        <Group label="Maks. TOEFL Minimum" icon={BookOpen}>
          <Input
            type="number" min="0"
            placeholder="Contoh: 80"
            value={filters.toeflMin}
            onChange={(e) => onChange({ ...filters, toeflMin: e.target.value })}
            className="h-9 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card text-foreground"
          />
        </Group>

        <Group label="Sumber Data" icon={Shield}>
          <select
            value={filters.sourceType}
            onChange={(e) => onChange({ ...filters, sourceType: e.target.value })}
            className="flex h-9 w-full rounded-lg border border-border/40 bg-card px-2.5 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          >
            <option value="">Semua Sumber</option>
            <option value="MANUAL">Kurasi RadarBeasiswa</option>
            <option value="SCRAPED">Hasil Auto-Scrape</option>
          </select>
        </Group>
      </div>
    </aside>
  );
}
