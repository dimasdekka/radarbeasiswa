"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  BrainCircuit,
  PenTool,
  Clock,
  Cpu,
  Flag,
  SlidersHorizontal,
  ArrowRight,
  ArrowUpRight,
  Quote,
  Star,
  Sparkles,
  Compass,
} from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { WordsReveal } from "@/components/animations/words-reveal";
import { Magnetic } from "@/components/animations/magnetic";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CountingNumber } from "@/components/animations/counting-number";

const ScholarshipGlobe = dynamic(() => import("@/components/three/scholarship-globe").then((m) => m.ScholarshipGlobe), {
  ssr: false,
  loading: () => <div className="aspect-square w-full max-w-[640px] animate-pulse rounded-full bg-primary/5" />,
});

const FEATURES = [
  { no: "01", title: "AI Match Score", desc: "Profil akademik dan minatmu dicocokkan ke 119+ beasiswa. Skor kecocokan presisi beserta alasannya.", icon: BrainCircuit, glow: "var(--violet)" },
  { no: "02", title: "Essay Studio", desc: "AI mengurai rubrik jadi panduan pertanyaan, menyusun draf, dan memberi umpan balik per paragraf.", icon: PenTool, glow: "var(--magenta)" },
  { no: "03", title: "Deadline Tracker", desc: "Status pendaftaran rapi — Riset, Essay, Dokumen, Submit — lengkap checklist dan pengingat.", icon: Clock, glow: "var(--gold)" },
  { no: "04", title: "Auto-Scraping AI", desc: "Scraper menyisir portal beasiswa berkala, dinormalisasi AI agar data selalu segar dan valid.", icon: Cpu, glow: "var(--cyan)" },
  { no: "05", title: "Konteks Indonesia", desc: "Disusun untuk pelajar Indonesia. Syarat dokumen dan rubrik essay dalam Bahasa Indonesia natural.", icon: Flag, glow: "var(--rose)" },
  { no: "06", title: "Filter Pintar", desc: "Saring jenjang, batas IPK, syarat TOEFL/IELTS, hingga cakupan pendanaan secara instan.", icon: SlidersHorizontal, glow: "var(--leaf)" },
];

const STEPS = [
  { num: "01", title: "Buat Akun", desc: "Daftar gratis dalam hitungan detik dengan email dan password." },
  { num: "02", title: "Setup Profil", desc: "Isi nilai, IPK, target, atau unggah CV untuk dipindai AI." },
  { num: "03", title: "Lihat Match Score", desc: "AI membandingkan profilmu dengan seluruh database beasiswa." },
  { num: "04", title: "Tulis & Ajukan", desc: "Susun essay di Essay Studio, lengkapi berkas, kawal deadline." },
];

const SCHOLARSHIPS = [
  { name: "LPDP Kemenkeu", country: "Indonesia" },
  { name: "Chevening", country: "Inggris" },
  { name: "DAAD", country: "Jerman" },
  { name: "Australia Awards", country: "Australia" },
  { name: "MEXT", country: "Jepang" },
  { name: "Fulbright", country: "Amerika" },
  { name: "Stipendium Hungaricum", country: "Hungaria" },
  { name: "Tanoto Foundation", country: "Indonesia" },
  { name: "Djarum Plus", country: "Indonesia" },
  { name: "Erasmus Mundus", country: "Eropa" },
];

const TESTIMONIALS = [
  { quote: "Match Score-nya bikin aku fokus ke beasiswa yang realistis buat profilku. Hemat waktu banget.", name: "Dinda A.", role: "Mahasiswa S1 — incar LPDP" },
  { quote: "Essay Studio ngebantu pas mentok. Feedback per paragrafnya tajam dan langsung bisa dipakai.", name: "Rizky P.", role: "Fresh Grad — target Chevening" },
  { quote: "Nggak perlu buka belasan situs lagi. Semua deadline kepantau di satu tempat.", name: "Maya S.", role: "Siswa SMA kelas 12" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background font-body text-foreground">
      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-4 flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 shadow-lg shadow-primary/5 backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative flex h-7 w-7 items-center justify-center">
              <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-accent opacity-90" />
              <Sparkles className="relative h-4 w-4 text-white" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Radar<span className="text-gradient">Beasiswa</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {[
              { href: "#fitur", label: "Fitur" },
              { href: "#cara-kerja", label: "Cara Kerja" },
              { href: "#beasiswa", label: "Beasiswa" },
              { href: "#testimoni", label: "Testimoni" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="link-underline text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
              Masuk
            </Link>
            <Link href="/auth/register" className={cn(buttonVariants({ size: "sm" }), "shine")}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO with 3D */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Aurora backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-40 mask-radial-faded" />
          <div className="aurora" style={{ background: "radial-gradient(circle at 78% 35%, hsl(var(--aurora-1)/0.45), transparent 55%)" }} />
          <div className="aurora" style={{ background: "radial-gradient(circle at 85% 70%, hsl(var(--aurora-3)/0.3), transparent 55%)" }} />
        </div>

        {/* Globe — anchored right, draggable */}
        <div className="absolute inset-y-0 right-0 z-0 flex w-full items-center justify-center lg:w-[58%] lg:justify-end lg:pr-[4%]">
          <ScholarshipGlobe />
        </div>

        {/* Readability scrim — stronger on the left where text lives */}
        {/* Readability scrim — soft radial pool behind the text, no hard seam */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
          style={{ background: "radial-gradient(60% 80% at 22% 50%, hsl(var(--background)) 0%, hsl(var(--background)/0.7) 35%, transparent 65%)" }}
        />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-background/60 lg:hidden" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20 bg-gradient-to-t from-background to-transparent" />

        {/* Content — left aligned on desktop. pointer-events-none so the globe stays draggable; re-enabled on interactive bits. */}
        <div className="pointer-events-none relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-16 pt-28 text-center lg:items-start lg:text-left">
          <Reveal className="pointer-events-auto mb-7 inline-flex items-center gap-2 self-center rounded-full border border-primary/30 bg-card/70 px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur-md lg:self-start">
            <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-glow" />
            Bertenaga Google Gemini AI
          </Reveal>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground [text-shadow:0_2px_30px_hsl(var(--background)),0_0_60px_hsl(var(--background))] sm:text-6xl md:text-7xl">
            <WordsReveal as="span" text="Temukan beasiswa" className="justify-center lg:justify-start" />
            <WordsReveal as="span" text="yang ditakdirkan" className="mt-1 justify-center text-gradient lg:justify-start" delay={0.25} />
            <WordsReveal as="span" text="untukmu." className="mt-1 justify-center lg:justify-start" delay={0.5} />
          </h1>

          <Reveal delay={0.6} className="mx-auto mt-7 max-w-xl text-lg font-medium leading-relaxed text-foreground/75 [text-shadow:0_1px_20px_hsl(var(--background))] lg:mx-0">
            Kurasi 119+ beasiswa terpopuler. AI memindai profilmu, menyusun checklist, menulis draf
            essay, dan mengawal setiap deadline — semuanya dalam satu tempat.
          </Reveal>

          <Reveal delay={0.75} className="pointer-events-auto mt-10 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center">
            <Magnetic>
              <Link href="/auth/register" className={cn(buttonVariants({ size: "xl" }), "group w-full px-10 text-base shine sm:w-auto")}>
                Mulai Gratis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Link href="/auth/login" className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full border-border bg-card/70 px-10 text-base backdrop-blur-md sm:w-auto")}>
              Sudah Punya Akun
            </Link>
          </Reveal>

          <Reveal delay={0.9} className="mt-8 flex items-center gap-2 self-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground lg:self-start">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Tanpa kartu kredit · Setup &lt; 2 menit · 100% gratis
          </Reveal>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="flex h-9 w-6 items-start justify-center rounded-full border border-border bg-background/40 p-1.5 backdrop-blur">
            <div className="h-2 w-1 rounded-full bg-primary animate-float-slow" />
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="relative border-y border-border bg-card/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-border">
          {[
            { v: 119, suffix: "+", label: "Beasiswa Terkurasi" },
            { v: 6, suffix: "", label: "Fitur Bertenaga AI" },
            { v: 100, suffix: "%", label: "Gratis Selamanya" },
          ].map((s) => (
            <div key={s.label} className="px-4 py-10 text-center">
              <div className="font-display text-4xl font-bold tabular text-gradient sm:text-5xl">
                <CountingNumber value={s.v} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <section className="overflow-hidden border-b border-border py-5">
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="marquee flex w-max items-center gap-10 whitespace-nowrap">
            {[...SCHOLARSHIPS, ...SCHOLARSHIPS].map((s, i) => (
              <span key={i} className="flex items-center gap-2.5 font-display text-lg font-medium text-foreground/60">
                {s.name}
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{s.country}</span>
                <span className="ml-6 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — glowing bento */}
      <section id="fitur" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="mb-16 max-w-2xl">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Fitur</p>
          <h2 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Semua yang kamu butuhkan, <span className="text-gradient">dari riset hingga submit.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.08} direction="up">
                <article
                  className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card/60 p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40"
                  style={{ boxShadow: "0 1px 2px hsl(var(--foreground)/0.04)" }}
                >
                  {/* glow on hover */}
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `hsl(${f.glow} / 0.35)` }}
                  />
                  <div className="relative">
                    <div className="mb-6 flex items-center justify-between">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/60"
                        style={{ color: `hsl(${f.glow})` }}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <span className="font-mono text-xs text-muted-foreground/40">{f.no}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold tracking-tight text-foreground">{f.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* QUOTE BAND */}
      <section className="relative isolate overflow-hidden border-y border-border">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a0b2e] via-primary to-[#3b1a5c]" />
        <div className="absolute inset-0 z-0 bg-grid opacity-10" />
        <div className="absolute -left-20 top-0 z-0 h-80 w-80 rounded-full bg-[hsl(var(--aurora-2)/0.45)] blur-[110px]" />
        <div className="absolute -right-20 bottom-0 z-0 h-80 w-80 rounded-full bg-[hsl(var(--aurora-3)/0.35)] blur-[110px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center text-white">
          <Reveal>
            <Quote className="mx-auto h-9 w-9 text-accent" />
            <p className="mt-6 font-display text-2xl font-semibold leading-snug text-white sm:text-3xl md:text-4xl">
              Beasiswa terbaik bukan yang paling terkenal — tapi yang paling cocok dengan dirimu.
            </p>
            <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.22em] text-white/60">Filosofi RadarBeasiswa</p>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-kerja" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="mb-16 max-w-2xl">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Cara Kerja</p>
          <h2 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Empat langkah menuju <span className="text-gradient">beasiswa impian.</span>
          </h2>
        </Reveal>

        <div className="divide-y divide-border border-y border-border">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.06} direction="left">
              <div className="group grid grid-cols-[auto_1fr] items-baseline gap-6 py-8 transition-colors hover:bg-card/40 sm:grid-cols-[5rem_1fr_auto] sm:px-4">
                <span className="font-display text-3xl font-bold text-muted-foreground/30 transition-all duration-300 group-hover:text-gradient sm:text-4xl">
                  {s.num}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">{s.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
                <ArrowUpRight className="hidden h-5 w-5 self-center text-muted-foreground/30 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary sm:block" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BEASISWA SHOWCASE */}
      <section id="beasiswa" className="border-t border-border bg-card/30 py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 lg:grid-cols-2 lg:items-center">
          <Reveal direction="right">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Direktori</p>
            <h2 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              Pilihan terbaik, <span className="text-gradient">dalam &amp; luar negeri.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Indeks dari puluhan penyedia terpopuler — beasiswa penuh pemerintah, filantropi seperti
              Djarum dan Tanoto, hingga program internasional di UK, Australia, Jerman, dan Amerika.
            </p>
            <Magnetic>
              <Link href="/auth/register" className={cn(buttonVariants({ size: "lg" }), "group mt-8 shine")}>
                Lihat Semua Indeks
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Magnetic>
          </Reveal>

          <div className="overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
            {SCHOLARSHIPS.slice(0, 6).map((s, i) => (
              <Reveal key={s.name} delay={i * 0.05}>
                <div className="group flex items-center justify-between gap-4 border-b border-border px-6 py-5 transition-colors last:border-b-0 hover:bg-primary/5">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">{s.name}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{s.country}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimoni" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="mb-16 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Testimoni</p>
            <h2 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              Dipakai pelajar yang serius.
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-accent text-accent" />
            ))}
            <span className="ml-2 text-sm font-medium text-muted-foreground">4.9 / 5</span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08} direction="scale">
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card/60 p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/40">
                <Quote className="h-6 w-6 text-accent/60" />
                <blockquote className="mt-5 flex-1 text-base leading-relaxed text-foreground/90">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-sm font-bold text-white">
                    {t.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-28">
        <Reveal direction="scale" className="glow-border mx-auto max-w-5xl rounded-3xl">
          <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="absolute inset-0 -z-10 bg-grid opacity-30 mask-radial-faded" />
            <Compass className="mx-auto mb-6 h-9 w-9 text-primary" strokeWidth={1.5} />
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Siap temukan <span className="text-gradient">beasiswa impianmu?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Daftar gratis dalam dua menit. Lengkapi profil, dapatkan Match Score, dan mulai susun
              essay terbaikmu bersama AI.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Magnetic>
                <Link href="/auth/register" className={cn(buttonVariants({ size: "lg" }), "group shine")}>
                  Daftar Sekarang
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Magnetic>
              <Link href="/auth/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Masuk Akun
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
          <Link href="/" className="font-display text-lg font-bold tracking-tight">
            Radar<span className="text-gradient">Beasiswa</span>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            Platform AI pendamping pendaftaran beasiswa pelajar Indonesia.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            © 2026 · JuaraVibeCoding
          </p>
        </div>
      </footer>
    </div>
  );
}
