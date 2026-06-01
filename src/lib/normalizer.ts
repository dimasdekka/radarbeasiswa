import { generateJson } from "@/lib/gemini";

export interface NormalizedScholarship {
  nama: string;
  provider: string;
  negara: string;
  jenjang: string[]; // ["S1","S2","S3"]
  targetUser: string[]; // ["SMA","MAHASISWA"]
  deadline: string | null; // ISO date or null
  deadlineNote: string | null;
  cakupan: string[];
  ipkMinimum: number | null;
  nilaiMinimum: number | null;
  toeflMinimum: number | null;
  ieltsMinimum: number | null;
  pengalamanMin: number | null;
  bidangStudi: string[];
  bahasa: string[];
  persyaratan: { umum?: string[]; dokumen?: string[] };
  checklistDok: string[];
  urlResmi: string;
  imageUrl: string | null;
  confidence: "high" | "medium" | "low";
  notes: string;
}

const SYSTEM_PROMPT = `Kamu adalah asisten data beasiswa. Tugasmu mengekstrak informasi beasiswa dari halaman web ke format JSON terstruktur.

ATURAN PENTING:
1. Hanya ekstrak fakta yang BENAR-BENAR ada di teks. Jangan mengarang.
2. Jika informasi tidak tersedia, gunakan null atau array kosong.
3. JANGAN buat tanggal deadline palsu. Jika deadline tidak jelas, set deadline=null dan tulis di deadlineNote.
4. negara harus dalam Bahasa Indonesia (contoh: "Inggris" bukan "United Kingdom").
5. jenjang hanya: S1, S2, S3.
6. targetUser hanya: SMA, MAHASISWA.
7. Set confidence "low" jika data sangat tidak lengkap, "high" jika lengkap dan jelas.
8. notes singkat (1 kalimat) menjelaskan kualitas data.
9. imageUrl: ambil URL gambar/logo utama beasiswa dari halaman (biasanya logo provider, banner, atau hero image). Harus URL absolut. Null jika tidak ada.
10. Output WAJIB JSON valid, tanpa markdown code fence, tanpa text tambahan.`;

/**
 * Normalize raw scraped content to a structured Beasiswa JSON via Gemini.
 * Per PRD section 4.5 — Gemini 1.5 Pro normalize hasil scraping ke format standar.
 */
export async function normalizeScholarship(
  rawTitle: string,
  rawContent: string,
  sourceUrl: string,
  images?: string[]
): Promise<NormalizedScholarship> {
  const imageContext = images && images.length > 0
    ? `\n\nGambar yang ditemukan di halaman:\n${images.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n\nPilih satu URL gambar yang paling relevan sebagai logo/banner beasiswa untuk field "imageUrl". Prioritaskan logo provider atau banner utama. Jika tidak ada yang relevan, set null.`
    : "";

  const userPrompt = `Halaman: ${sourceUrl}
Judul: ${rawTitle}

Isi halaman:
${rawContent}${imageContext}

Ekstrak menjadi JSON dengan struktur ini (gunakan null/[] jika tidak tersedia):
{
  "nama": "Nama beasiswa",
  "provider": "Penyelenggara",
  "negara": "Negara tujuan",
  "jenjang": ["S1"|"S2"|"S3"],
  "targetUser": ["SMA"|"MAHASISWA"],
  "deadline": "YYYY-MM-DD" | null,
  "deadlineNote": "Catatan periode pendaftaran" | null,
  "cakupan": ["Biaya kuliah", "Tunjangan hidup"],
  "ipkMinimum": 3.0 | null,
  "nilaiMinimum": null,
  "toeflMinimum": null,
  "ieltsMinimum": null,
  "pengalamanMin": null,
  "bidangStudi": ["Engineering"],
  "bahasa": ["Inggris"],
  "persyaratan": { "umum": ["..."], "dokumen": ["..."] },
  "checklistDok": ["KTP", "Ijazah"],
  "urlResmi": "${sourceUrl}",
  "imageUrl": "https://..." | null,
  "confidence": "high"|"medium"|"low",
  "notes": "Catatan singkat"
}`;

  // Resilient call: retries with backoff + model fallback, parses JSON.
  return await generateJson<NormalizedScholarship>(userPrompt, {
    systemInstruction: SYSTEM_PROMPT,
  });
}
