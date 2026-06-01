"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageManager } from "@/components/admin/image-manager";

interface BeasiswaForm {
  nama: string;
  provider: string;
  negara: string;
  jenjang: string;
  targetUser: string;
  cakupan: string;
  bidangStudi: string;
  bahasa: string;
  checklistDok: string;
  ipkMinimum: string;
  nilaiMinimum: string;
  toeflMinimum: string;
  ieltsMinimum: string;
  pengalamanMin: string;
  deadline: string;
  deadlineNote: string;
  urlResmi: string;
  imageUrl: string;
  verified: boolean;
  aktif: boolean;
  persyaratanUmum: string;
  persyaratanDokumen: string;
}

const empty: BeasiswaForm = {
  nama: "", provider: "", negara: "", jenjang: "", targetUser: "", cakupan: "",
  bidangStudi: "", bahasa: "", checklistDok: "", ipkMinimum: "", nilaiMinimum: "",
  toeflMinimum: "", ieltsMinimum: "", pengalamanMin: "", deadline: "", deadlineNote: "",
  urlResmi: "", imageUrl: "", verified: false, aktif: true,
  persyaratanUmum: "", persyaratanDokumen: "",
};

export default function EditBeasiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<BeasiswaForm>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/beasiswa/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.beasiswa) { setError("Tidak ditemukan"); return; }
        const b = d.beasiswa;
        const p = b.persyaratan ?? {};
        setForm({
          nama: b.nama ?? "",
          provider: b.provider ?? "",
          negara: b.negara ?? "",
          jenjang: (b.jenjang ?? []).join(", "),
          targetUser: (b.targetUser ?? []).join(", "),
          cakupan: (b.cakupan ?? []).join("\n"),
          bidangStudi: (b.bidangStudi ?? []).join(", "),
          bahasa: (b.bahasa ?? []).join(", "),
          checklistDok: (b.checklistDok ?? []).join("\n"),
          ipkMinimum: b.ipkMinimum?.toString() ?? "",
          nilaiMinimum: b.nilaiMinimum?.toString() ?? "",
          toeflMinimum: b.toeflMinimum?.toString() ?? "",
          ieltsMinimum: b.ieltsMinimum?.toString() ?? "",
          pengalamanMin: b.pengalamanMin?.toString() ?? "",
          deadline: b.deadline ? new Date(b.deadline).toISOString().split("T")[0] : "",
          deadlineNote: b.deadlineNote ?? "",
          urlResmi: b.urlResmi ?? "",
          imageUrl: b.imageUrl ?? "",
          verified: b.verified ?? false,
          aktif: b.aktif ?? true,
          persyaratanUmum: (p.umum ?? []).join("\n"),
          persyaratanDokumen: (p.dokumen ?? []).join("\n"),
        });
      })
      .catch(() => setError("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const splitList = (s: string) => s.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
    const splitLines = (s: string) => s.split("\n").map(x => x.trim()).filter(Boolean);

    const body = {
      nama: form.nama,
      provider: form.provider,
      negara: form.negara,
      jenjang: splitList(form.jenjang),
      targetUser: splitList(form.targetUser),
      cakupan: splitLines(form.cakupan),
      bidangStudi: splitList(form.bidangStudi),
      bahasa: splitList(form.bahasa),
      checklistDok: splitLines(form.checklistDok),
      ipkMinimum: form.ipkMinimum,
      nilaiMinimum: form.nilaiMinimum,
      toeflMinimum: form.toeflMinimum,
      ieltsMinimum: form.ieltsMinimum,
      pengalamanMin: form.pengalamanMin,
      deadline: form.deadline || null,
      deadlineNote: form.deadlineNote,
      urlResmi: form.urlResmi,
      imageUrl: form.imageUrl,
      verified: form.verified,
      aktif: form.aktif,
      persyaratan: {
        umum: splitLines(form.persyaratanUmum),
        dokumen: splitLines(form.persyaratanDokumen),
      },
    };

    const res = await fetch(`/api/admin/beasiswa/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin/beasiswa");
    } else {
      const d = await res.json();
      setError(d.error ?? "Gagal menyimpan");
    }
    setSaving(false);
  }

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-10">Memuat...</div>;
  if (error && !form.nama) return <div className="mx-auto max-w-3xl px-6 py-10 text-destructive">{error}</div>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <Link href="/admin/beasiswa" className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Kembali ke daftar
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Edit Beasiswa</h1>
      </header>

      {error && !form.nama ? null : (
        <Section title="Gambar Card">
          <ImageManager
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            beasiswaId={id}
            name={form.nama || "Beasiswa"}
          />
        </Section>
      )}

      <div className="mt-5 space-y-5">
        <Section title="Info dasar">
          <Field label="Nama beasiswa *" value={form.nama} onChange={(v) => setForm({ ...form, nama: v })} required />
          <Field label="Provider *" value={form.provider} onChange={(v) => setForm({ ...form, provider: v })} required />
          <Field label="Negara *" value={form.negara} onChange={(v) => setForm({ ...form, negara: v })} required />
          <Field label="URL resmi *" value={form.urlResmi} onChange={(v) => setForm({ ...form, urlResmi: v })} required type="url" />
        </Section>

        <Section title="Klasifikasi">
          <Field label="Jenjang (pisah koma)" value={form.jenjang} onChange={(v) => setForm({ ...form, jenjang: v })} hint="contoh: S1, S2, S3" />
          <Field label="Target user" value={form.targetUser} onChange={(v) => setForm({ ...form, targetUser: v })} hint="contoh: SMA, MAHASISWA" />
          <Field label="Bidang studi" value={form.bidangStudi} onChange={(v) => setForm({ ...form, bidangStudi: v })} hint="pisah koma" />
          <Field label="Bahasa" value={form.bahasa} onChange={(v) => setForm({ ...form, bahasa: v })} hint="contoh: Inggris, Indonesia" />
        </Section>

        <Section title="Deadline">
          <Field label="Deadline (tanggal)" value={form.deadline} onChange={(v) => setForm({ ...form, deadline: v })} type="date" />
          <Field label="Catatan deadline" value={form.deadlineNote} onChange={(v) => setForm({ ...form, deadlineNote: v })} hint="jika tanggal pasti tidak diketahui" />
        </Section>

        <Section title="Cakupan & Persyaratan">
          <TextareaField label="Cakupan (1 baris per item)" value={form.cakupan} onChange={(v) => setForm({ ...form, cakupan: v })} rows={4} />
          <TextareaField label="Persyaratan umum (1 baris per item)" value={form.persyaratanUmum} onChange={(v) => setForm({ ...form, persyaratanUmum: v })} rows={5} />
          <TextareaField label="Persyaratan dokumen (1 baris per item)" value={form.persyaratanDokumen} onChange={(v) => setForm({ ...form, persyaratanDokumen: v })} rows={4} />
          <TextareaField label="Checklist dokumen (1 baris per item)" value={form.checklistDok} onChange={(v) => setForm({ ...form, checklistDok: v })} rows={5} />
        </Section>

        <Section title="Minimum syarat">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="IPK min" value={form.ipkMinimum} onChange={(v) => setForm({ ...form, ipkMinimum: v })} type="number" step="0.01" />
            <Field label="Nilai min" value={form.nilaiMinimum} onChange={(v) => setForm({ ...form, nilaiMinimum: v })} type="number" step="0.01" />
            <Field label="TOEFL min" value={form.toeflMinimum} onChange={(v) => setForm({ ...form, toeflMinimum: v })} type="number" />
            <Field label="IELTS min" value={form.ieltsMinimum} onChange={(v) => setForm({ ...form, ieltsMinimum: v })} type="number" step="0.5" />
            <Field label="Pengalaman min (thn)" value={form.pengalamanMin} onChange={(v) => setForm({ ...form, pengalamanMin: v })} type="number" />
          </div>
        </Section>

        <Section title="Status">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
              Verified (sudah dicek admin)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} />
              Aktif (tampil ke user)
            </label>
          </div>
        </Section>
      </div>

      {error && <p className="mt-4 rounded-md border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="mt-8 flex gap-3 border-t pt-6">
        <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan perubahan"}</Button>
        <Link href="/admin/beasiswa">
          <Button type="button" variant="outline">Batal</Button>
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, hint, step,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; hint?: string; step?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} step={step} className="mt-1" />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label, value, onChange, rows = 3,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="mt-1" />
    </div>
  );
}
