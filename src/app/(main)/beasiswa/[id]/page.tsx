import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EligibilitySection } from "@/components/eligibility-section";
import { MulaiApplyButton } from "@/components/mulai-apply-button";
import { BeasiswaHeroImage } from "@/components/beasiswa-hero-image";
import { getGradientColors, getCountryFlagSmall } from "@/lib/scholarship-logos";
import { requireAdmin } from "@/lib/admin-auth";
import {
  ArrowLeft,
  Calendar,
  Globe,
  GraduationCap,
  Award,
  BookOpen,
  CheckSquare,
  FileText,
  Languages,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  LucideIcon
} from "lucide-react";

function formatDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

interface PersyaratanShape {
  umum?: string[];
  dokumen?: string[];
  [k: string]: unknown;
}

export default async function BeasiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const b = await prisma.beasiswa.findUnique({ where: { id } });
  if (!b) notFound();

  const persyaratan = (b.persyaratan as PersyaratanShape) ?? {};
  const rubrik = b.rubrikEssay as Record<string, string> | null;
  const [c1, c2] = getGradientColors(b.nama);
  const flagUrl = getCountryFlagSmall(b.negara);
  const admin = await requireAdmin();
  const isAdmin = admin !== null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 transition-colors duration-300">
      <Link
        href="/beasiswa"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Kembali ke direktori
      </Link>

      {/* Hero Banner */}
      <div
        className="relative mb-8 h-60 w-full overflow-hidden rounded-2xl border border-border/30 shadow-md"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        <BeasiswaHeroImage imageUrl={b.imageUrl} urlResmi={b.urlResmi} nama={b.nama} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        
        {/* Large Flag Tag */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 shadow-lg ring-1 ring-white/20">
          <Image
            src={flagUrl}
            alt={b.negara}
            width={32}
            height={20}
            className="h-4.5 w-auto rounded-xs object-cover"
            unoptimized
          />
          <span className="font-mono text-xs font-bold text-foreground/80 uppercase tracking-widest">{b.negara}</span>
        </div>
      </div>

      {/* Header Info Block */}
      <header className="border-b border-border/20 pb-8">
        <div className="mb-4.5 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-bold text-[9px] tracking-wider px-2 py-0.5 border-border/40">
            <Globe className="h-3 w-3 mr-1" />
            {b.negara}
          </Badge>
          {b.jenjang.map((j) => (
            <Badge key={j} variant="outline" className="font-bold text-[9px] tracking-wider px-2 py-0.5 border-border/40">
              <GraduationCap className="h-3 w-3 mr-1 text-primary" />
              {j}
            </Badge>
          ))}
          {b.targetUser.map((t) => (
            <Badge key={t} variant="outline" className="font-bold text-[9px] tracking-wider px-2 py-0.5 border-border/40">
              <UserCheck className="h-3 w-3 mr-1 text-accent" />
              {t}
            </Badge>
          ))}
          {isAdmin && b.sourceType === "MANUAL" && <Badge className="text-[9px] font-bold tracking-wider px-2 py-0.5">Kurasi</Badge>}
          {isAdmin && b.sourceType === "SCRAPED" && <Badge variant="secondary" className="text-[9px] font-bold tracking-wider px-2 py-0.5">Scraped</Badge>}
          {b.verified && <Badge variant="success" className="text-[9px] font-bold tracking-wider px-2 py-0.5">Verified</Badge>}
        </div>
        
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl text-foreground mt-3">
          {b.nama}
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-muted-foreground font-medium">{b.provider}</p>
      </header>

      {/* Action Buttons Row */}
      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <a
          href={b.urlResmi} target="_blank" rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 text-xs font-bold uppercase tracking-wider border-border/40 hover:bg-muted/30 group")}
        >
          Portal Resmi
          <ExternalLink className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
        <MulaiApplyButton beasiswaId={b.id} />
      </div>

      {/* Split details columns */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Detail Requirements & AI Evaluation */}
        <div className="space-y-10 lg:col-span-2">
          {/* AI Eligibility Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-1.5 text-foreground/80 font-bold border-b border-border/10 pb-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              <h2 className="font-display text-sm font-extrabold uppercase tracking-widest">Penilaian Kelayakan AI</h2>
            </div>
            <EligibilitySection beasiswaId={b.id} />
          </section>

          {/* Cakupan Beasiswa */}
          <section className="space-y-4">
            <div className="flex items-center gap-1.5 text-foreground/80 font-bold border-b border-border/10 pb-2">
              <Award className="h-4.5 w-4.5 text-primary" />
              <h2 className="font-display text-sm font-extrabold uppercase tracking-widest">Cakupan Pendanaan</h2>
            </div>
            <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {b.cakupan.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm p-3.5 shadow-xs">
                  <span className="text-primary font-bold mt-0.5">✦</span>
                  <span className="text-xs sm:text-sm text-foreground/85 leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Persyaratan Akademik */}
          <section className="space-y-4">
            <div className="flex items-center gap-1.5 text-foreground/80 font-bold border-b border-border/10 pb-2">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
              <h2 className="font-display text-sm font-extrabold uppercase tracking-widest">Syarat & Kualifikasi</h2>
            </div>

            {/* Min score values grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {b.ipkMinimum && <ReqCell label="IPK Min" value={b.ipkMinimum} icon={GraduationCap} />}
              {b.nilaiMinimum && <ReqCell label="Rapor Min" value={b.nilaiMinimum} icon={FileText} />}
              {b.toeflMinimum && <ReqCell label="TOEFL Min" value={b.toeflMinimum} icon={Languages} />}
              {b.ieltsMinimum && <ReqCell label="IELTS Min" value={b.ieltsMinimum} icon={Languages} />}
              {b.pengalamanMin && <ReqCell label="Kerja Min" value={`${b.pengalamanMin}+ Thn`} icon={Clock} />}
            </div>

            {persyaratan.umum && persyaratan.umum.length > 0 && (
              <ul className="space-y-2.5 pt-3">
                {persyaratan.umum.map((p, i) => (
                  <li key={i} className="flex gap-3 border-l-2 border-primary/30 pl-4 py-0.5">
                    <span className="font-mono text-xs text-muted-foreground/60 font-bold tabular-nums w-4 mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Checklist Dokumen */}
          {b.checklistDok.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 text-foreground/80 font-bold border-b border-border/10 pb-2">
                <CheckSquare className="h-4.5 w-4.5 text-primary" />
                <h2 className="font-display text-sm font-extrabold uppercase tracking-widest">Checklist Berkas Dokumen</h2>
              </div>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {b.checklistDok.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm p-4 shadow-xs">
                    <input type="checkbox" disabled className="h-4 w-4 rounded-sm border-border/40 accent-primary flex-shrink-0 cursor-not-allowed" />
                    <span className="text-xs sm:text-sm text-foreground/85 leading-snug">{d}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Rubrik Essay */}
          {rubrik && Object.keys(rubrik).length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 text-foreground/80 font-bold border-b border-border/10 pb-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <h2 className="font-display text-sm font-extrabold uppercase tracking-widest">Rubrik Penulisan Esai</h2>
              </div>
              <ul className="space-y-4">
                {Object.entries(rubrik).map(([k, v]) => (
                  <li key={k} className="border-l-2 border-primary/30 pl-4 py-1">
                    <p className="font-display text-base font-bold text-foreground capitalize tracking-tightish">{k}</p>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">{v}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right Column: Meta info Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card className="glass-premium border-border/30 shadow-sm overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-1.5 border-b border-border/10 pb-3 mb-2.5 text-foreground/80 font-bold">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-[10px] uppercase tracking-widest">Ikhtisar Beasiswa</h3>
              </div>
              
              <Meta icon={Calendar} label="Batas Pendaftaran" value={formatDate(b.deadline) ?? b.deadlineNote ?? "Belum diumumkan"} />
              <Meta icon={BookOpen} label="Fokus Bidang Studi" value={b.bidangStudi.join(", ")} />
              <Meta icon={Languages} label="Bahasa Pengantar" value={b.bahasa.join(", ")} />
              {b.verifiedAt && <Meta icon={ShieldCheck} label="Diverifikasi Tanggal" value={formatDate(b.verifiedAt) ?? "—"} />}
              <Meta icon={Clock} label="Terakhir Diperbarui" value={formatDate(b.updatedAt) ?? "—"} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ReqCell({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm p-3.5 shadow-xs flex justify-between items-start">
      <div>
        <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-foreground">{value}</div>
        <div className="mt-1 font-mono text-[9px] uppercase font-bold tracking-widest text-muted-foreground">{label}</div>
      </div>
      <div className="h-7 w-7 rounded-md border border-border/40 text-muted-foreground bg-muted/20 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
    </div>
  );
}

function Meta({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-muted-foreground/60">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[9px] uppercase font-bold tracking-widest">{label}</span>
      </div>
      <p className="text-xs sm:text-sm font-semibold text-foreground leading-normal pl-4.5">{value}</p>
    </div>
  );
}
