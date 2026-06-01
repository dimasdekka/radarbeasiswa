import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const samples = [
  {
    sourceName: "LPDP Resmi",
    sourceUrl: "https://lpdp.kemenkeu.go.id/beasiswa/umum/beasiswa-reguler",
    rawTitle: "Beasiswa Reguler LPDP Tahap 1 2026",
    rawContent:
      "LPDP membuka pendaftaran Beasiswa Reguler Tahap 1 2026 dari 17 Januari hingga 17 Februari 2026. Kategori Reguler ini terbuka untuk WNI lulusan S1/S2 yang ingin melanjutkan studi S2 atau S3 di dalam atau luar negeri. Persyaratan utama: IPK minimal 3.00 (S1) atau 3.25 (S2), skor TOEFL iBT 80 atau IELTS 6.5 untuk luar negeri, surat rekomendasi 2 buah, esai kontribusi setelah lulus, LoA Unconditional dari universitas tujuan jika sudah ada, dan komitmen kembali ke Indonesia setelah lulus. Cakupan beasiswa meliputi biaya kuliah penuh, tunjangan hidup bulanan, biaya kedatangan, asuransi kesehatan, dan tunjangan keluarga.",
    normalizedData: {
      nama: "Beasiswa Reguler LPDP Tahap 1 2026",
      provider: "LPDP Kemenkeu",
      negara: "Indonesia",
      jenjang: ["S2", "S3"],
      targetUser: ["MAHASISWA"],
      deadline: "2026-02-17",
      deadlineNote: "Tahap 1: 17 Januari - 17 Februari 2026",
      cakupan: ["Biaya kuliah penuh", "Tunjangan hidup bulanan", "Biaya kedatangan", "Asuransi kesehatan", "Tunjangan keluarga"],
      ipkMinimum: 3.0,
      nilaiMinimum: null,
      toeflMinimum: 80,
      ieltsMinimum: 6.5,
      pengalamanMin: null,
      bidangStudi: ["Semua bidang prioritas LPDP"],
      bahasa: ["Indonesia", "Inggris"],
      persyaratan: {
        umum: ["WNI", "Lulusan S1/S2 dari PT terakreditasi", "IPK minimal 3.00 (S1) atau 3.25 (S2)", "TOEFL iBT 80 atau IELTS 6.5 untuk luar negeri", "Komitmen kembali ke Indonesia"],
        dokumen: ["Ijazah", "Transkrip", "Sertifikat bahasa", "Surat rekomendasi (2)", "Esai kontribusi", "LoA Unconditional"],
      },
      checklistDok: ["KTP", "Ijazah", "Transkrip", "Sertifikat TOEFL/IELTS", "Surat rekomendasi (2)", "Esai kontribusi", "LoA Unconditional", "Pas foto"],
      urlResmi: "https://lpdp.kemenkeu.go.id/beasiswa/umum/beasiswa-reguler",
      confidence: "high",
      notes: "Data dari halaman resmi LPDP, periode pendaftaran jelas",
    },
    status: "PENDING_REVIEW",
  },
  {
    sourceName: "Stipendium Hungaricum",
    sourceUrl: "https://stipendiumhungaricum.hu",
    rawTitle: "Stipendium Hungaricum 2026/2027 Application Period Opens",
    rawContent:
      "The Stipendium Hungaricum scholarship programme application period for 2026/2027 academic year is open from 16 November 2025 until 15 January 2026. Indonesian citizens are eligible to apply for Bachelor's, Master's, and Doctoral programmes. The scholarship covers full tuition fees, monthly stipend (HUF 43,700 for BA/MA, HUF 140,000 for PhD), free or subsidized accommodation, and health insurance. Required documents include high school diploma or bachelor's certificate, transcripts, language certificate (English or Hungarian), motivation letter, and medical certificate. Minimum requirements: GPA 3.0/4.0, TOEFL 500 PBT or IELTS 5.5.",
    normalizedData: {
      nama: "Stipendium Hungaricum 2026/2027",
      provider: "Pemerintah Hungaria (Tempus Public Foundation)",
      negara: "Hungaria",
      jenjang: ["S1", "S2", "S3"],
      targetUser: ["SMA", "MAHASISWA"],
      deadline: "2026-01-15",
      deadlineNote: "Periode aplikasi: 16 November 2025 - 15 Januari 2026",
      cakupan: ["Biaya kuliah penuh", "Tunjangan bulanan HUF 43,700 (S1/S2) atau HUF 140,000 (S3)", "Akomodasi gratis atau subsidi", "Asuransi kesehatan"],
      ipkMinimum: 3.0,
      nilaiMinimum: null,
      toeflMinimum: 500,
      ieltsMinimum: 5.5,
      pengalamanMin: null,
      bidangStudi: ["Engineering", "Sains", "Bisnis", "Humaniora", "Kedokteran"],
      bahasa: ["Inggris", "Hungaria"],
      persyaratan: {
        umum: ["WN dari negara mitra (termasuk Indonesia)", "Memenuhi syarat akademik dan bahasa", "IPK minimal 3.0/4.0"],
        dokumen: ["Ijazah/SKL", "Transkrip", "Sertifikat bahasa Inggris atau Hungaria", "Motivation letter", "Medical certificate"],
      },
      checklistDok: ["Ijazah", "Transkrip", "Sertifikat bahasa", "Motivation letter", "Medical certificate", "Paspor", "Surat rekomendasi"],
      urlResmi: "https://stipendiumhungaricum.hu",
      confidence: "high",
      notes: "Data dari sumber resmi, periode pendaftaran tercantum jelas",
    },
    status: "PENDING_REVIEW",
  },
  {
    sourceName: "Chevening UK",
    sourceUrl: "https://www.chevening.org/scholarship/indonesia/",
    rawTitle: "Chevening Scholarship Indonesia 2026/2027",
    rawContent:
      "Pendaftaran Chevening Scholarship 2026/2027 dibuka. Persyaratan untuk pelamar Indonesia: pengalaman kerja minimal 2 tahun (2,800 jam), diterima di tiga universitas UK, dan komitmen kembali ke Indonesia minimal 2 tahun setelah lulus. Beasiswa mencakup biaya kuliah penuh, tunjangan hidup bulanan, tiket pesawat PP, visa, dan tunjangan kedatangan.",
    normalizedData: {
      nama: "Chevening Scholarship 2026/2027",
      provider: "Pemerintah Inggris (FCDO)",
      negara: "Inggris",
      jenjang: ["S2"],
      targetUser: ["MAHASISWA"],
      deadline: null,
      deadlineNote: "Periode pendaftaran biasanya September-November setiap tahun, cek website resmi untuk tanggal terbaru",
      cakupan: ["Biaya kuliah penuh", "Tunjangan hidup bulanan", "Tiket pesawat PP", "Visa", "Tunjangan kedatangan"],
      ipkMinimum: 3.0,
      nilaiMinimum: null,
      toeflMinimum: null,
      ieltsMinimum: 6.5,
      pengalamanMin: 2,
      bidangStudi: ["Semua bidang di universitas UK"],
      bahasa: ["Inggris"],
      persyaratan: {
        umum: ["WN Indonesia", "Pengalaman kerja minimal 2 tahun (2,800 jam)", "Diterima di 3 universitas UK", "Kembali ke Indonesia minimal 2 tahun setelah lulus"],
        dokumen: ["Ijazah", "Transkrip", "Sertifikat IELTS", "4 Essay", "Surat rekomendasi (2)"],
      },
      checklistDok: ["Paspor", "Ijazah", "Transkrip", "Sertifikat IELTS", "4 Essay (Leadership, Networking, Studi, Karir)", "Surat rekomendasi (2)", "LoA dari 3 universitas UK"],
      urlResmi: "https://www.chevening.org/scholarship/indonesia/",
      confidence: "medium",
      notes: "Deadline spesifik tidak ditemukan di halaman utama, gunakan deadlineNote",
    },
    status: "PENDING_REVIEW",
  },
];

async function main() {
  console.log(`🌱 Seeding ${samples.length} sample scraped records...`);

  // Clear only PENDING_REVIEW samples to avoid wiping real reviewed work
  await prisma.scrapedScholarship.deleteMany({
    where: { status: "PENDING_REVIEW", sourceName: { in: samples.map((s) => s.sourceName) } },
  });

  for (const s of samples) {
    await prisma.scrapedScholarship.create({ data: s });
    console.log(`  ✓ ${s.normalizedData.nama}`);
  }

  console.log(`\n✅ Seeded ${samples.length} sample scraped records`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
