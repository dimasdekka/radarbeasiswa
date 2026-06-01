"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import {
  Sparkles,
  BookOpen,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LucideIcon,
  RefreshCw,
  Compass,
  Target,
  PenTool,
} from "lucide-react";
import { SpotlightCard } from "@/components/animations/spotlight-card";
import { CountingNumber } from "@/components/animations/counting-number";
import { Reveal } from "@/components/animations/reveal";
import { DashboardCharts } from "@/components/dashboard-charts";

interface Reminder {
  applicationId: string;
  beasiswaNama: string;
  priority: "high" | "medium" | "low";
  message: string;
  daysLeft: number | null;
  readyDocs: number;
  totalDocs: number;
  essayWords: number;
  recommendations: string[];
}

interface DashboardData {
  stats: { totalBeasiswa: number; matchCount: number; newScrapedCount: number; applicationsCount: number };
  charts: { byCountry: { negara: string; count: number }[]; byJenjang: { jenjang: string; count: number }[]; funding: { name: string; value: number }[] };
  topMatches: { id: string; nama: string; provider: string; negara: string; matchScore: number }[];
  upcomingDeadlines: { id: string; nama: string; provider: string; negara: string; deadline: string | null; deadlineNote: string | null }[];
  newScraped: { id: string; nama: string; provider: string; negara: string }[];
  applications: { id: string; status: string; matchScore: number; beasiswa: { nama: string; provider: string; deadline: string | null; deadlineNote: string | null } }[];
  reminders: Reminder[];
  hasProfile: boolean;
}

function formatDeadline(deadline: string | null, deadlineNote: string | null) {
  if (deadline) return new Date(deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return deadlineNote ?? "—";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const scannerGlowsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
      setLoading(false);
      if (json.hasProfile) {
        setTimeout(() => startScan(json.stats.matchCount), 300);
      }
    })();
  }, []);

  const startScan = (targetScore: number) => {
    setIsScanning(true);
    setDisplayScore(0);
    const scoreVal = { val: 0 };
    gsap.to(scoreVal, {
      val: targetScore,
      duration: 2.2,
      ease: "power3.out",
      onUpdate: () => setDisplayScore(Math.floor(scoreVal.val)),
      onComplete: () => setIsScanning(false),
    });
    gsap.fromTo(
      ".top-match-item",
      { opacity: 0, x: -20, filter: "blur(5px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.15, ease: "power2.out", delay: 0.2 }
    );
    if (scannerGlowsRef.current) {
      gsap.fromTo(
        scannerGlowsRef.current,
        { scale: 0.8, opacity: 0.5 },
        { scale: 1.2, opacity: 1, duration: 0.5, repeat: 4, yoyo: true, ease: "sine.inOut" }
      );
    }
  };

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 h-24 animate-pulse rounded-2xl bg-muted/40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <Reveal className="mb-10 flex flex-col gap-6 border-b border-border/30 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-primary">
            <span className="h-2 w-2 rounded-full bg-accent pulse-glow" />
            Dasbor — {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Selamat Datang di Portal Anda<span className="text-primary">.</span>
          </h1>
        </div>

        {!data.hasProfile && (
          <div className="flex max-w-md items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Profil Akademik Belum Lengkap</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Lengkapi profil agar AI bisa mencocokkan beasiswa.{" "}
                <Link href="/onboarding" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                  Lengkapi Profil →
                </Link>
              </p>
            </div>
          </div>
        )}
      </Reveal>

      {/* Stats + Radar */}
      <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCell num={data.stats.totalBeasiswa} label="Total Beasiswa" icon={BookOpen} desc="Dalam database indeks" delay={0} />
          <StatCell num={data.stats.matchCount} label="Cocok Untukmu" icon={Sparkles} desc="Berdasarkan kualifikasi" highlight delay={70} />
          <StatCell num={data.stats.newScrapedCount} label="Baru Di-Scrape" icon={Cpu} desc="Scraped & verified" delay={140} />
          <StatCell num={data.stats.applicationsCount} label="Aplikasi Aktif" icon={CheckCircle2} desc="Dalam progres pendaftaran" delay={210} />
        </div>

        {/* Sonar Radar widget */}
        <Reveal delay={120} className="relative flex min-h-[300px] flex-col items-center justify-between overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-6 shadow-md backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="relative z-10 mb-4 w-full text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">AI Scanning Radar</p>
            <h3 className="mt-1 font-display text-base font-bold text-foreground">Pemindaian Beasiswa Aktif</h3>
          </div>

          <div className="relative my-2 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-primary/20 shadow-inner">
            <div className={cn("radar-sweep absolute inset-0 rounded-full transition-all duration-300", isScanning && "[animation-duration:1.5s]")} />
            <div className="absolute inset-x-0 top-1/2 h-px bg-primary/20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-primary/20" />
            <div className="absolute inset-[20%] rounded-full border border-primary/10" />
            <div ref={scannerGlowsRef} className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-1/4 h-2.5 w-2.5 animate-ping rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />
              <div className="absolute bottom-1/4 right-1/4 h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              <div className="absolute right-1/3 top-1/2 h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            </div>
            <div className="relative z-10 flex min-w-[70px] flex-col items-center rounded-xl border border-border/40 bg-background/85 px-4 py-2.5 shadow-sm backdrop-blur-sm">
              <span className="font-display text-2xl font-bold tabular text-foreground">{displayScore}</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Match</span>
            </div>
          </div>

          <div className="relative z-10 mt-4 w-full text-center">
            <button
              onClick={() => data.hasProfile && startScan(data.stats.matchCount)}
              disabled={isScanning || !data.hasProfile}
              className={cn(buttonVariants({ size: "sm" }), "w-full text-xs font-bold uppercase tracking-wider")}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isScanning && "animate-spin")} />
              {isScanning ? "Memindai..." : "Pindai Ulang Profil"}
            </button>
          </div>
        </Reveal>
      </div>

      {/* Insight charts */}
      {data.charts && data.stats.totalBeasiswa > 0 && (
        <Reveal className="mb-12">
          <SectionHead
            eyebrow="Statistik Direktori"
            title={<>Peta Beasiswa <span className="text-gradient">Saat Ini</span></>}
            right={<Badge variant="outline">{data.stats.totalBeasiswa} total</Badge>}
          />
          <DashboardCharts data={data.charts} />
        </Reveal>
      )}

      {/* Smart Reminders */}
      {data.reminders.length > 0 && (
        <Reveal className="mb-12">
          <SectionHead eyebrow="Alarm Pintar" title={<>Yang Harus Ditindak Lanjuti <span className="text-primary">Hari Ini</span></>} right={<Badge variant="outline">{data.reminders.length} Tugas</Badge>} />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {data.reminders.slice(0, 4).map((r) => (
              <ReminderCard key={r.applicationId} reminder={r} />
            ))}
          </div>
        </Reveal>
      )}

      {/* Match + Deadlines */}
      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Reveal>
          <Panel eyebrow="Rekomendasi Kesesuaian" title={<>Skor Match <span className="text-primary">Tertinggi</span></>} link="/beasiswa?view=match" empty={!data.hasProfile ? "Lengkapi profil untuk melihat skor kecocokan." : "Belum ada beasiswa yang cocok."}>
            {data.topMatches.length > 0 && (
              <ul className="divide-y divide-border/20 border-t border-border/30">
                {data.topMatches.map((b, i) => (
                  <li key={b.id} className="top-match-item">
                    <Link href={`/beasiswa/${b.id}`} className="group flex items-center justify-between gap-4 rounded-lg px-2 py-4 transition-colors hover:bg-muted/20">
                      <div className="flex items-center gap-3">
                        <span className="w-5 font-mono text-xs font-bold text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{b.nama}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{b.provider} · {b.negara}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-display text-xl font-bold tracking-tight text-foreground">{b.matchScore}%</span>
                          <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-accent">Cocok</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={90}>
          <Panel eyebrow="Tenggat Waktu" title={<>Deadline <span className="text-primary">Terdekat</span></>} link="/beasiswa?view=deadline" empty="Tidak ada tenggat dalam waktu dekat.">
            {data.upcomingDeadlines.length > 0 && (
              <ul className="divide-y divide-border/20 border-t border-border/30">
                {data.upcomingDeadlines.map((b) => (
                  <li key={b.id}>
                    <Link href={`/beasiswa/${b.id}`} className="group flex items-center justify-between gap-4 rounded-lg px-2 py-4 transition-colors hover:bg-muted/20">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{b.nama}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{b.provider} · {b.negara}</p>
                      </div>
                      <Badge variant="warning" className="font-mono">{formatDeadline(b.deadline, b.deadlineNote)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </Reveal>
      </div>

      {/* New Scraped */}
      {data.newScraped.length > 0 && (
        <Reveal className="mb-12">
          <SectionHead eyebrow="Discovery Pipeline" title={<>Hasil Scrape <span className="text-primary">Terverifikasi</span></>} right={<Link href="/beasiswa?view=scraped" className="font-mono text-xs uppercase tracking-widest text-primary hover:underline">Lihat Semua →</Link>} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.newScraped.map((b) => (
              <Link key={b.id} href={`/beasiswa/${b.id}`} className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                <div>
                  <Badge variant="success" className="mb-3">Scraped · Verified</Badge>
                  <p className="line-clamp-2 font-display text-base font-bold leading-snug text-foreground">{b.nama}</p>
                </div>
                <p className="mt-3 border-t border-border/10 pt-2 text-xs text-muted-foreground">{b.provider} · {b.negara}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* Active Applications */}
      {data.applications.length > 0 && (
        <Reveal className="mb-12">
          <SectionHead eyebrow="Aplikasi Anda" title={<>Pendaftaran yang <span className="text-primary">Berjalan</span></>} right={<span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{data.applications.length} Aplikasi</span>} />
          <ul className="divide-y divide-border/20 overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
            {data.applications.slice(0, 5).map((app) => (
              <li key={app.id}>
                <Link href={`/apply/${app.id}/essay`} className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/20">
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{app.beasiswa.nama}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{app.beasiswa.provider} · Tenggat: {formatDeadline(app.beasiswa.deadline, app.beasiswa.deadlineNote)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{app.status.replace("_", " ")}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      )}

      {/* Quick Actions */}
      <div className="border-t border-border/30 pt-8">
        <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">Aksi Cepat</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/beasiswa" className={cn(buttonVariants(), "text-xs font-bold uppercase tracking-wider")}>
            <Compass className="h-4 w-4" /> Jelajahi Indeks
          </Link>
          <Link href="/beasiswa?view=match" className={cn(buttonVariants({ variant: "accent" }), "text-xs font-bold uppercase tracking-wider")}>
            <Target className="h-4 w-4" /> Rekomendasi Profil
          </Link>
          <Link href="/profil" className={cn(buttonVariants({ variant: "outline" }), "text-xs font-bold uppercase tracking-wider")}>
            <PenTool className="h-4 w-4" /> Sunting Profil
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCell({ num, label, icon: Icon, desc, highlight, delay }: { num: number; label: string; icon: LucideIcon; desc: string; highlight?: boolean; delay: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <SpotlightCard
        spotlightColor={highlight ? "hsl(var(--primary) / 0.15)" : "hsl(var(--accent) / 0.1)"}
        className={cn("h-full bg-card/50 p-5 backdrop-blur-sm", highlight ? "border-primary/30" : "border-border/40")}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="block font-display text-4xl font-bold tracking-tight tabular text-foreground sm:text-5xl">
              <CountingNumber value={num} />
            </span>
            <span className="mt-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", highlight ? "border-primary/20 bg-primary/10 text-primary" : "border-border/40 bg-muted/20 text-muted-foreground")}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 border-t border-border/10 pt-2 text-[11px] text-muted-foreground">{desc}</p>
      </SpotlightCard>
    </Reveal>
  );
}

function SectionHead({ eyebrow, title, right }: { eyebrow: string; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-border/30 pb-3">
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Panel({ eyebrow, title, link, empty, children }: { eyebrow: string; title: React.ReactNode; link?: string; empty?: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/40 bg-card/50 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">{title}</h2>
        </div>
        {link && (
          <Link href={link} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">Lihat →</Link>
        )}
      </div>
      {children || <p className="py-8 text-center text-xs italic text-muted-foreground">{empty}</p>}
    </div>
  );
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const badgeColor =
    reminder.priority === "high"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : reminder.priority === "medium"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "border-border/40 bg-muted/40 text-muted-foreground";

  return (
    <SpotlightCard
      spotlightColor={reminder.priority === "high" ? "rgba(239,68,68,0.12)" : "hsl(var(--accent) / 0.1)"}
      className="border-border/40 bg-card/50 backdrop-blur-sm"
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="line-clamp-1 font-display text-base font-bold leading-snug text-foreground">{reminder.beasiswaNama}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {reminder.readyDocs}/{reminder.totalDocs} Berkas · {reminder.essayWords} Kata Essay
            </p>
          </div>
          <Badge className={cn("border", badgeColor)}>{reminder.message}</Badge>
        </div>
        {reminder.recommendations.length > 0 && (
          <ul className="space-y-2 border-t border-border/10 pt-3 text-xs leading-relaxed">
            {reminder.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-muted-foreground">
                <span className="font-bold text-primary">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/apply/${reminder.applicationId}/essay`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs font-bold uppercase tracking-wider hover:border-primary hover:bg-primary hover:text-primary-foreground")}
        >
          Lanjutkan Aplikasi
        </Link>
      </div>
    </SpotlightCard>
  );
}
