"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { CvUploadCard, type ParsedCvData } from "@/components/cv-upload-card";
import { GraduationCap, ArrowRight, ArrowLeft, School, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { SpotlightCard } from "@/components/animations/spotlight-card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion, AnimatePresence } from "framer-motion";

type Tipe = "SMA" | "MAHASISWA" | null;

const NEGARA_OPTIONS = ["Indonesia", "Singapura", "Malaysia", "Jepang", "Korea Selatan", "Inggris", "Amerika Serikat", "Australia", "Jerman", "Belanda", "Hungaria", "Belgia", "Eropa lain"];
const BIDANG_OPTIONS = ["Teknik", "Sains", "Komputer/IT", "Ekonomi/Bisnis", "Hukum", "Kedokteran", "Pendidikan", "Sosial-Humaniora", "Seni-Desain", "Pertanian", "Lingkungan"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/10"
          : "border-border/30 bg-card/65 text-muted-foreground hover:border-border/80 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tipe, setTipe] = useState<Tipe>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.tipe) {
        setTipe(user.user_metadata.tipe);
        setStep(1);
      }
    })();
  }, []);

  const [smaForm, setSmaForm] = useState({
    kelas: "", namaSekolah: "", nilaiRataRata: "",
    prestasi: "", ekstrakurikuler: "",
    targetJenjang: "S1", targetNegara: [] as string[], targetBidang: [] as string[],
    butuhFinansial: false,
  });

  const [mhsForm, setMhsForm] = useState({
    jenjang: "", jurusan: "", universitas: "", ipk: "", toefl: "", ielts: "",
    pengalaman: "", publikasi: "",
    targetJenjang: "S2", targetNegara: [] as string[], targetBidang: [] as string[],
    butuhFinansial: false,
  });

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function applyCvData(d: ParsedCvData) {
    const detectedTipe: Tipe = d.tipe === "SMA" || d.tipe === "MAHASISWA" ? d.tipe : null;
    if (detectedTipe) {
      setTipe(detectedTipe);
      setStep(1);
    }

    if (detectedTipe === "SMA") {
      setSmaForm((prev) => ({
        ...prev,
        kelas: d.kelas ?? prev.kelas,
        namaSekolah: d.namaSekolah ?? prev.namaSekolah,
        nilaiRataRata: d.nilaiRataRata != null ? String(d.nilaiRataRata) : prev.nilaiRataRata,
        prestasi: d.prestasi && d.prestasi.length > 0 ? d.prestasi.join("\n") : prev.prestasi,
        ekstrakurikuler: d.ekstrakurikuler && d.ekstrakurikuler.length > 0 ? d.ekstrakurikuler.join("\n") : prev.ekstrakurikuler,
        targetJenjang: d.targetJenjang ?? prev.targetJenjang,
        targetNegara: d.targetNegara && d.targetNegara.length > 0 ? d.targetNegara : prev.targetNegara,
        targetBidang: d.targetBidang && d.targetBidang.length > 0 ? d.targetBidang : prev.targetBidang,
        butuhFinansial: d.butuhFinansial ?? prev.butuhFinansial,
      }));
    } else if (detectedTipe === "MAHASISWA") {
      setMhsForm((prev) => ({
        ...prev,
        jenjang: d.jenjang ?? prev.jenjang,
        jurusan: d.jurusan ?? prev.jurusan,
        universitas: d.universitas ?? prev.universitas,
        ipk: d.ipk != null ? String(d.ipk) : prev.ipk,
        toefl: d.toefl != null ? String(d.toefl) : prev.toefl,
        ielts: d.ielts != null ? String(d.ielts) : prev.ielts,
        pengalaman: d.pengalaman && d.pengalaman.length > 0 ? d.pengalaman.join("\n") : prev.pengalaman,
        publikasi: d.publikasi && d.publikasi.length > 0 ? d.publikasi.join("\n") : prev.publikasi,
        targetJenjang: d.targetJenjang ?? prev.targetJenjang,
        targetNegara: d.targetNegara && d.targetNegara.length > 0 ? d.targetNegara : prev.targetNegara,
        targetBidang: d.targetBidang && d.targetBidang.length > 0 ? d.targetBidang : prev.targetBidang,
        butuhFinansial: d.butuhFinansial ?? prev.butuhFinansial,
      }));
    }
  }

  async function handleSubmit() {
    if (!tipe) return;
    setError("");
    setLoading(true);

    const payload = tipe === "SMA"
      ? {
          tipe,
          kelas: smaForm.kelas, namaSekolah: smaForm.namaSekolah,
          nilaiRataRata: smaForm.nilaiRataRata ? parseFloat(smaForm.nilaiRataRata) : null,
          prestasi: smaForm.prestasi.split("\n").map(s => s.trim()).filter(Boolean),
          ekstrakurikuler: smaForm.ekstrakurikuler.split("\n").map(s => s.trim()).filter(Boolean),
          targetJenjang: smaForm.targetJenjang, targetNegara: smaForm.targetNegara,
          targetBidang: smaForm.targetBidang, butuhFinansial: smaForm.butuhFinansial,
        }
      : {
          tipe,
          jenjang: mhsForm.jenjang, jurusan: mhsForm.jurusan, universitas: mhsForm.universitas,
          ipk: mhsForm.ipk ? parseFloat(mhsForm.ipk) : null,
          toefl: mhsForm.toefl ? parseInt(mhsForm.toefl) : null,
          ielts: mhsForm.ielts ? parseFloat(mhsForm.ielts) : null,
          pengalaman: mhsForm.pengalaman.split("\n").map(s => s.trim()).filter(Boolean),
          publikasi: mhsForm.publikasi.split("\n").map(s => s.trim()).filter(Boolean),
          targetJenjang: mhsForm.targetJenjang, targetNegara: mhsForm.targetNegara,
          targetBidang: mhsForm.targetBidang, butuhFinansial: mhsForm.butuhFinansial,
        };

    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Gagal menyimpan data"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background transition-colors duration-300">
      <AuroraBackground className="fixed" grain={false} />
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        {/* Step Progress Tracker */}
        <div className="mb-10 flex items-center justify-between rounded-2xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">Setup Profil</span>
            <span className="h-1 w-8 rounded-full bg-border" />
            <span className="font-mono text-xs font-semibold uppercase text-muted-foreground">{step === 0 ? "Tipe Akun" : "Data Akademik"}</span>
          </div>
          <span className="font-mono text-xs font-bold tabular text-muted-foreground/60">Langkah {step + 1} dari 2</span>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Pilih tipe */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="space-y-8"
            >
              <header className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Langkah Awal Pendaftaran · RadarBeasiswa
                </p>
                <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
                  Ceritakan tentang dirimu
                  <span className="text-primary font-black">.</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Pilih jenjang akademik Anda saat ini atau unggah CV pendaftaran Anda. Kami akan menyesuaikan rekomendasi beasiswa yang paling pas untuk Anda.
                </p>
              </header>

              {/* CV Upload Card */}
              <div className="glass-premium rounded-xl overflow-hidden border border-border/30 p-5 shadow-sm">
                <CvUploadCard onParsed={applyCvData} />
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-border/30" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold whitespace-nowrap">Atau Konfigurasi Manual</span>
                <div className="h-px flex-1 bg-border/30" />
              </div>

              {/* Selection Options panels */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <SpotlightCard
                  spotlightColor="rgba(79, 70, 229, 0.12)" // Indigo glow
                  className="cursor-pointer group relative p-8 text-left h-[280px] bg-card/40 backdrop-blur-sm border-border/30"
                  onClick={() => { setTipe("SMA"); setStep(1); }}
                >
                  <div className="flex flex-col justify-between h-full w-full">
                    <div>
                      <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-4">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <School className="h-4.5 w-4.5" />
                        </div>
                        <span className="font-mono text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">OPSI A</span>
                      </div>
                      <p className="font-display text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">Siswa SMA / Sederajat</p>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Persiapan mendaftar beasiswa S1 dalam atau luar negeri.</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent border-t border-border/15 pt-4 w-full mt-4">
                      <span>Pilih & Mulai</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </SpotlightCard>

                <SpotlightCard
                  spotlightColor="rgba(0, 106, 99, 0.12)" // Teal glow
                  className="cursor-pointer group relative p-8 text-left h-[280px] bg-card/40 backdrop-blur-sm border-border/30"
                  onClick={() => { setTipe("MAHASISWA"); setStep(1); }}
                >
                  <div className="flex flex-col justify-between h-full w-full">
                    <div>
                      <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-4">
                        <div className="h-9 w-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                          <GraduationCap className="h-4.5 w-4.5" />
                        </div>
                        <span className="font-mono text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">OPSI B</span>
                      </div>
                      <p className="font-display text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">Mahasiswa / Fresh Grad</p>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Persiapan mendaftar beasiswa S2/S3 dalam atau luar negeri.</p>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent border-t border-border/15 pt-4 w-full mt-4">
                      <span>Pilih & Mulai</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            </motion.div>
          )}

          {/* Step 1: SMA Form */}
          {step === 1 && tipe === "SMA" && (
            <motion.div
              key="step-1-sma"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="space-y-8"
            >
              <button 
                onClick={() => setStep(0)} 
                className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Kembali ke opsi tipe
              </button>
              
              <header className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold">Langkah 2: Data Akademik</p>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                  Kualifikasi Siswa SMA
                  <span className="text-primary font-black">.</span>
                </h1>
              </header>

              {/* Form Wrap */}
              <div className="glass-premium rounded-xl p-6 border border-border/30 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Pilih Kelas</Label>
                    <select
                      value={smaForm.kelas}
                      onChange={(e) => setSmaForm({ ...smaForm, kelas: e.target.value })}
                      className="flex h-11 w-full rounded-lg border border-border/40 bg-card px-3 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                    >
                      <option value="">Pilih Kelas</option>
                      <option value="10">Kelas 10</option>
                      <option value="11">Kelas 11</option>
                      <option value="12">Kelas 12</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Nilai Rata-Rata Rapor</Label>
                    <Input type="number" step="0.1" min="0" max="100" placeholder="Contoh: 88.5"
                      value={smaForm.nilaiRataRata}
                      onChange={(e) => setSmaForm({ ...smaForm, nilaiRataRata: e.target.value })}
                      className="h-11 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-foreground/80">Nama Sekolah</Label>
                  <Input placeholder="Contoh: SMA Negeri 1 Jakarta"
                    value={smaForm.namaSekolah}
                    onChange={(e) => setSmaForm({ ...smaForm, namaSekolah: e.target.value })}
                    className="h-11 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-foreground/80">Prestasi / Penghargaan (satu per baris)</Label>
                  <Textarea rows={3} placeholder="Juara 1 OSN Matematika 2024&#10;Juara 2 Lomba Debat Bahasa Inggris Nasional"
                    value={smaForm.prestasi}
                    onChange={(e) => setSmaForm({ ...smaForm, prestasi: e.target.value })}
                    className="text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-foreground/80">Ekstrakurikuler Aktif (satu per baris)</Label>
                  <Textarea rows={3} placeholder="OSIS - Ketua Departemen Humas&#10;Klub Robotik - Anggota"
                    value={smaForm.ekstrakurikuler}
                    onChange={(e) => setSmaForm({ ...smaForm, ekstrakurikuler: e.target.value })}
                    className="text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                  />
                </div>

                {/* Negara list */}
                <div className="space-y-3">
                  <Label className="font-bold text-xs uppercase text-foreground/80 block">Target Negara Tujuan</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {NEGARA_OPTIONS.map((n) => (
                      <Chip key={n} active={smaForm.targetNegara.includes(n)}
                        onClick={() => setSmaForm({ ...smaForm, targetNegara: toggleArrayItem(smaForm.targetNegara, n) })}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Bidang list */}
                <div className="space-y-3">
                  <Label className="font-bold text-xs uppercase text-foreground/80 block">Target Bidang Studi</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {BIDANG_OPTIONS.map((b) => (
                      <Chip key={b} active={smaForm.targetBidang.includes(b)}
                        onClick={() => setSmaForm({ ...smaForm, targetBidang: toggleArrayItem(smaForm.targetBidang, b) })}>
                        {b}
                      </Chip>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/30 bg-muted/10 p-4 transition-all hover:bg-muted/20 border-l-4 border-l-accent">
                  <input type="checkbox"
                    checked={smaForm.butuhFinansial}
                    onChange={(e) => setSmaForm({ ...smaForm, butuhFinansial: e.target.checked })}
                    className="h-4 w-4 rounded-sm border-border/40 accent-accent flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-foreground/90 font-medium">
                    Saya membutuhkan beasiswa penuh (<span className="text-accent font-bold">Full-Funded</span>) untuk menunjang biaya kuliah and biaya hidup.
                  </div>
                </label>

                {error && (
                  <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-4 flex items-center gap-3 text-xs text-destructive">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                <div className="flex gap-3 border-t border-border/10 pt-6">
                  <Button variant="outline" onClick={() => setStep(0)} className="h-12 border-border/40 text-xs font-bold uppercase tracking-wider">Kembali</Button>
                  <Button onClick={handleSubmit} disabled={loading} size="lg" className="flex-1 h-12 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/20">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Menyimpan Data...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Simpan & Lanjutkan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Mahasiswa Form */}
          {step === 1 && tipe === "MAHASISWA" && (
            <motion.div
              key="step-1-mahasiswa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="space-y-8"
            >
              <button 
                onClick={() => setStep(0)} 
                className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                Kembali ke opsi tipe
              </button>
              
              <header className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold">Langkah 2: Data Akademik</p>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                  Kualifikasi Mahasiswa
                  <span className="text-primary font-black">.</span>
                </h1>
              </header>

              {/* Form Wrap */}
              <div className="glass-premium rounded-xl p-6 border border-border/30 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Status Akademik</Label>
                    <select
                      value={mhsForm.jenjang}
                      onChange={(e) => setMhsForm({ ...mhsForm, jenjang: e.target.value })}
                      className="flex h-11 w-full rounded-lg border border-border/40 bg-card px-3 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                    >
                      <option value="">Pilih Status</option>
                      <option value="S1_AKTIF">S1 Aktif / Kuliah</option>
                      <option value="FRESH_GRADUATE">Fresh Graduate</option>
                      <option value="S2_AKTIF">S2 Aktif / Kuliah</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">IPK Terakhir (Skala 4.0)</Label>
                    <Input type="number" step="0.01" min="0" max="4" placeholder="Contoh: 3.75"
                      value={mhsForm.ipk}
                      onChange={(e) => setMhsForm({ ...mhsForm, ipk: e.target.value })}
                      className="h-11 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Jurusan / Program Studi</Label>
                    <Input placeholder="Contoh: Teknik Informatika"
                      value={mhsForm.jurusan}
                      onChange={(e) => setMhsForm({ ...mhsForm, jurusan: e.target.value })}
                      className="h-11 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Nama Universitas / Institusi</Label>
                    <Input placeholder="Contoh: Institut Teknologi Bandung"
                      value={mhsForm.universitas}
                      onChange={(e) => setMhsForm({ ...mhsForm, universitas: e.target.value })}
                      className="h-11 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Skor TOEFL (iBT / PBT)</Label>
                    <Input type="number" min="0" max="677" placeholder="Contoh: PBT 550 / iBT 80"
                      value={mhsForm.toefl}
                      onChange={(e) => setMhsForm({ ...mhsForm, toefl: e.target.value })}
                      className="h-11 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Skor IELTS (Akademik)</Label>
                    <Input type="number" step="0.5" min="0" max="9" placeholder="Contoh: 6.5"
                      value={mhsForm.ielts}
                      onChange={(e) => setMhsForm({ ...mhsForm, ielts: e.target.value })}
                      className="h-11 text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-foreground/80">Pengalaman Kerja / Organisasi (satu per baris)</Label>
                  <Textarea rows={3} placeholder="Frontend Engineer di PT Telkom - 1 tahun&#10;Asisten Laboratorium Basis Data&#10;Koordinator Himpunan Mahasiswa Jurusan"
                    value={mhsForm.pengalaman}
                    onChange={(e) => setMhsForm({ ...mhsForm, pengalaman: e.target.value })}
                    className="text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-foreground/80">Publikasi / Penelitian (opsional, satu per baris)</Label>
                  <Textarea rows={2} placeholder="Paper di IEEE Conference tentang IoT 2024&#10;Penelitian Tugas Akhir Klasifikasi AI"
                    value={mhsForm.publikasi}
                    onChange={(e) => setMhsForm({ ...mhsForm, publikasi: e.target.value })}
                    className="text-xs font-semibold rounded-lg border-border/40 focus-visible:ring-primary bg-card"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-foreground/80">Target Jenjang Beasiswa</Label>
                    <select
                      value={mhsForm.targetJenjang}
                      onChange={(e) => setMhsForm({ ...mhsForm, targetJenjang: e.target.value })}
                      className="flex h-11 w-full rounded-lg border border-border/40 bg-card px-3 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
                    >
                      <option value="S2">S2 (Magister / Master)</option>
                      <option value="S3">S3 (Doktoral / PhD)</option>
                    </select>
                  </div>
                </div>

                {/* Negara list */}
                <div className="space-y-3">
                  <Label className="font-bold text-xs uppercase text-foreground/80 block">Target Negara Tujuan</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {NEGARA_OPTIONS.map((n) => (
                      <Chip key={n} active={mhsForm.targetNegara.includes(n)}
                        onClick={() => setMhsForm({ ...mhsForm, targetNegara: toggleArrayItem(mhsForm.targetNegara, n) })}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Bidang list */}
                <div className="space-y-3">
                  <Label className="font-bold text-xs uppercase text-foreground/80 block">Target Bidang Studi</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {BIDANG_OPTIONS.map((b) => (
                      <Chip key={b} active={mhsForm.targetBidang.includes(b)}
                        onClick={() => setMhsForm({ ...mhsForm, targetBidang: toggleArrayItem(mhsForm.targetBidang, b) })}>
                        {b}
                      </Chip>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/30 bg-muted/10 p-4 transition-all hover:bg-muted/20 border-l-4 border-l-accent">
                  <input type="checkbox"
                    checked={mhsForm.butuhFinansial}
                    onChange={(e) => setMhsForm({ ...mhsForm, butuhFinansial: e.target.checked })}
                    className="h-4 w-4 rounded-sm border-border/40 accent-accent flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-foreground/90 font-medium">
                    Saya membutuhkan beasiswa penuh (<span className="text-accent font-bold">Full-Funded</span>) untuk menunjang biaya kuliah dan biaya hidup.
                  </div>
                </label>

                {error && (
                  <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-4 flex items-center gap-3 text-xs text-destructive">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                <div className="flex gap-3 border-t border-border/10 pt-6">
                  <Button variant="outline" onClick={() => setStep(0)} className="h-12 border-border/40 text-xs font-bold uppercase tracking-wider">Kembali</Button>
                  <Button onClick={handleSubmit} disabled={loading} size="lg" className="flex-1 h-12 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/20">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Menyimpan Data...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Simpan & Lanjutkan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
