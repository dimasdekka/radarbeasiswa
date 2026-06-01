import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Tambahan beasiswa populer yang belum ada di seed.ts.
 * Idempotent: skip kalau nama+provider sudah ada.
 */
const additionalBeasiswa = [
  {
    nama: "BCA Finance Peduli",
    provider: "BCA Finance",
    negara: "Indonesia",
    jenjang: ["S1"],
    targetUser: ["MAHASISWA"],
    deadlineNote: "Pendaftaran biasanya Maret–Mei setiap tahun untuk mahasiswa semester 2-6",
    cakupan: ["Tunjangan biaya pendidikan Rp 3,5 juta per semester (selama 4 semester)"],
    nilaiMinimum: 3.0,
    bidangStudi: ["Semua bidang"],
    bahasa: ["Indonesia"],
    persyaratan: {
      umum: ["Mahasiswa S1 reguler PTN/PTS terakreditasi", "Berasal dari keluarga kurang mampu", "IPK minimal 3.00", "Tidak menerima beasiswa lain dari sumber lain"],
      dokumen: ["KTM", "Transkrip nilai", "Surat keterangan tidak mampu", "Essay motivasi"],
    },
    checklistDok: ["KTM", "Transkrip", "KTP", "KK", "Surat keterangan tidak mampu", "Essay motivasi", "Pas foto"],
    urlResmi: "https://www.bcafinance.co.id/beasiswa",
    sourceType: "MANUAL",
    verified: true,
  },
  {
    nama: "Astra 1st",
    provider: "PT Astra International",
    negara: "Indonesia",
    jenjang: ["S1"],
    targetUser: ["MAHASISWA"],
    deadlineNote: "Pendaftaran biasanya Februari–Maret untuk mahasiswa S1 semester 5-7",
    cakupan: ["Tunjangan beasiswa", "Pengembangan kepemimpinan", "Akses jaringan Astra Group", "Peluang fast-track karir di Astra"],
    nilaiMinimum: 3.25,
    bidangStudi: ["Engineering", "Bisnis", "Ekonomi", "Manajemen", "Komputer"],
    bahasa: ["Indonesia", "Inggris"],
    persyaratan: {
      umum: ["Mahasiswa aktif S1 semester 5–7 di PTN mitra Astra", "IPK minimal 3.25", "Aktif organisasi", "Kemampuan bahasa Inggris baik"],
      dokumen: ["Transkrip nilai", "CV", "Surat rekomendasi", "Essay kepemimpinan"],
    },
    checklistDok: ["KTM", "Transkrip", "CV", "Sertifikat organisasi", "Essay kepemimpinan", "Surat rekomendasi", "Pas foto"],
    urlResmi: "https://www.astra1st.com",
    sourceType: "MANUAL",
    verified: true,
  },
  {
    nama: "Türkiye Bursları",
    provider: "Pemerintah Türkiye",
    negara: "Türkiye",
    jenjang: ["S1", "S2", "S3"],
    targetUser: ["SMA", "MAHASISWA"],
    deadlineNote: "Pendaftaran biasanya Januari–Februari setiap tahun",
    cakupan: ["Biaya kuliah penuh", "Tunjangan bulanan TRY 4,000 (S1) / TRY 6,000 (S2) / TRY 8,000 (S3)", "Akomodasi", "Asuransi kesehatan", "Tiket pesawat sekali"],
    ipkMinimum: 3.0,
    nilaiMinimum: 7.0,
    bidangStudi: ["Engineering", "Sains", "Sosial", "Humaniora", "Kedokteran", "Teologi"],
    bahasa: ["Inggris", "Türkçe"],
    persyaratan: {
      umum: ["WNA (bukan WN Türkiye)", "Lulusan SMA atau sarjana dengan nilai baik", "Usia: maks 21 (S1), 30 (S2), 35 (S3)"],
      dokumen: ["Ijazah", "Transkrip", "Sertifikat bahasa", "Motivation letter", "Research proposal (S2/S3)"],
    },
    checklistDok: ["Ijazah", "Transkrip", "Paspor", "Pas foto", "Motivation letter", "Surat rekomendasi", "Sertifikat bahasa Inggris/Türkçe"],
    urlResmi: "https://turkiyeburslari.gov.tr",
    sourceType: "MANUAL",
    verified: true,
  },
  {
    nama: "Chinese Government Scholarship (CSC)",
    provider: "China Scholarship Council",
    negara: "China",
    jenjang: ["S1", "S2", "S3"],
    targetUser: ["SMA", "MAHASISWA"],
    deadlineNote: "Pendaftaran biasanya November–April tergantung universitas tujuan",
    cakupan: ["Biaya kuliah penuh", "Tunjangan bulanan CNY 2,500 (S1) / CNY 3,000 (S2) / CNY 3,500 (S3)", "Akomodasi", "Asuransi kesehatan"],
    ipkMinimum: 3.0,
    bidangStudi: ["Engineering", "Sains", "Sosial", "Bisnis", "Kedokteran", "Bahasa Mandarin"],
    bahasa: ["Mandarin", "Inggris"],
    persyaratan: {
      umum: ["WNA dengan kesehatan baik", "Usia maks 25 (S1), 35 (S2), 40 (S3)", "Memiliki ijazah yang dibutuhkan"],
      dokumen: ["Ijazah", "Transkrip", "Study plan", "Surat rekomendasi (2)", "Medical certificate", "HSK certificate (untuk program berbahasa Mandarin)"],
    },
    checklistDok: ["Ijazah", "Transkrip", "Paspor", "Study plan", "Surat rekomendasi (2)", "Medical certificate (Foreigner Physical Examination Form)", "HSK/IELTS"],
    urlResmi: "https://www.campuschina.org",
    sourceType: "MANUAL",
    verified: true,
  },
  {
    nama: "Korean Government Scholarship Program (KGSP / GKS)",
    provider: "National Institute for International Education (NIIED), Korea",
    negara: "Korea Selatan",
    jenjang: ["S1", "S2", "S3"],
    targetUser: ["SMA", "MAHASISWA"],
    deadlineNote: "Pendaftaran biasanya Februari–Maret (graduate) atau September–Oktober (undergraduate)",
    cakupan: ["Biaya kuliah penuh", "Tunjangan bulanan KRW 1,000,000", "Tiket pesawat PP", "Asuransi kesehatan", "Beasiswa belajar bahasa Korea 1 tahun"],
    ipkMinimum: 3.0,
    nilaiMinimum: 8.0,
    bidangStudi: ["Engineering", "Sains", "Sosial", "Humaniora", "Bisnis", "Kebudayaan Korea"],
    bahasa: ["Korea", "Inggris"],
    persyaratan: {
      umum: ["WNA", "Usia maks 25 (S1), 40 (S2/S3)", "Lulusan SMA atau sarjana", "Sehat jasmani rohani"],
      dokumen: ["Ijazah", "Transkrip", "Personal statement", "Study plan", "Surat rekomendasi (2)", "TOPIK certificate (kalau ada)"],
    },
    checklistDok: ["Ijazah", "Transkrip", "Paspor", "Personal statement", "Study plan", "Surat rekomendasi (2)", "Sertifikat bahasa Korea/Inggris"],
    urlResmi: "https://overseas.mofa.go.kr",
    sourceType: "MANUAL",
    verified: true,
  },
  {
    nama: "Singapore International Graduate Award (SINGA)",
    provider: "A*STAR & Singapore Universities (NUS, NTU, SMU, SUTD)",
    negara: "Singapura",
    jenjang: ["S3"],
    targetUser: ["MAHASISWA"],
    deadlineNote: "Pendaftaran 1 Juni dan 1 Desember setiap tahun",
    cakupan: ["Biaya kuliah penuh selama 4 tahun PhD", "Tunjangan bulanan SGD 2,700 (sebelum kualifikasi) / SGD 3,200 (setelah kualifikasi)", "Tunjangan akomodasi 1x", "Tiket pesawat sekali"],
    ipkMinimum: 3.5,
    toeflMinimum: 85,
    ieltsMinimum: 6.5,
    bidangStudi: ["Sains", "Engineering", "Komputer", "Biomedis"],
    bahasa: ["Inggris"],
    persyaratan: {
      umum: ["Memiliki gelar S1 dengan grade baik (preferensi First Class Honours)", "Untuk PhD, bukan PR/citizen Singapura", "Kemampuan riset dan publikasi (preferred)"],
      dokumen: ["Ijazah S1/S2", "Transkrip", "Research proposal", "CV", "Surat rekomendasi (2)"],
    },
    checklistDok: ["Ijazah", "Transkrip", "Sertifikat IELTS/TOEFL", "CV", "Research proposal", "Surat rekomendasi (2)", "Paspor"],
    urlResmi: "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa",
    sourceType: "MANUAL",
    verified: true,
  },
  {
    nama: "Mitsui Bussan Scholarship Program",
    provider: "Mitsui & Co., Ltd. Japan",
    negara: "Jepang",
    jenjang: ["S1"],
    targetUser: ["SMA"],
    deadlineNote: "Pendaftaran by invitation hanya, biasanya seleksi mulai Februari",
    cakupan: ["Biaya kuliah penuh selama 5,5 tahun (1,5 tahun bahasa Jepang + 4 tahun S1)", "Tunjangan bulanan JPY 145,000", "Tiket pesawat", "Asuransi", "Akomodasi"],
    nilaiMinimum: 8.5,
    bidangStudi: ["Semua bidang di universitas mitra"],
    bahasa: ["Jepang", "Inggris"],
    persyaratan: {
      umum: ["WNI lulus SMA dengan nilai unggul", "Usia maks 20 tahun saat program dimulai", "Belum menikah", "Kondisi sehat"],
      dokumen: ["Rapor SMA", "Ijazah", "Health certificate", "Essay"],
    },
    checklistDok: ["Rapor", "Ijazah/SKL", "Health certificate", "Essay", "Pas foto", "Paspor"],
    urlResmi: "https://www.mbkscholarship-id.com",
    sourceType: "MANUAL",
    verified: true,
  },
];

async function main() {
  console.log(`🌱 Adding ${additionalBeasiswa.length} popular beasiswa...`);

  let added = 0;
  let skipped = 0;
  for (const data of additionalBeasiswa) {
    const existing = await prisma.beasiswa.findFirst({
      where: { nama: { equals: data.nama, mode: "insensitive" }, provider: { equals: data.provider, mode: "insensitive" } },
    });
    if (existing) {
      console.log(`  - skip: ${data.nama} (sudah ada)`);
      skipped++;
      continue;
    }
    await prisma.beasiswa.create({
      data: { ...data, verifiedAt: new Date() },
    });
    console.log(`  ✓ ${data.nama}`);
    added++;
  }

  console.log(`\n✅ Done — ${added} ditambahkan, ${skipped} sudah ada`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
