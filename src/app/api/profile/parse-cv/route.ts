import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { generateJson, GeminiRateLimitError } from "@/lib/gemini";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Kamu adalah asisten ekstrak data CV/Resume. Tugasmu mengubah CV jadi struktur JSON profil pengguna BeasiswaRadar.

ATURAN:
1. Hanya ekstrak data yang benar-benar ada di CV. Jangan mengarang.
2. Jika tidak ada/tidak yakin, gunakan null untuk single value, [] untuk array.
3. Output WAJIB JSON valid, tanpa markdown fence, tanpa text tambahan.
4. tipe HANYA: "SMA" atau "MAHASISWA" — pilih berdasarkan konteks CV.
5. targetJenjang HANYA: "S1", "S2", atau "S3" — boleh null kalau gak jelas.
6. Untuk SMA, isi: kelas, namaSekolah, nilaiRataRata, prestasi, ekstrakurikuler.
7. Untuk MAHASISWA, isi: jenjang ("S1_AKTIF"|"FRESH_GRADUATE"|"S2_AKTIF"), jurusan, universitas, ipk, toefl, ielts, pengalaman, publikasi.
8. ipk: angka skala 4.0 (kalau di CV pakai skala lain, konversi).
9. toefl: integer (0-120 untuk iBT, 0-677 untuk PBT).
10. ielts: float (0-9).
11. nilaiRataRata: angka 0-100.
12. targetNegara/targetBidang: kalau ada hint dari objective/summary CV, isi; kalau tidak, [].

PENTING — SEGMENTASI BERDASARKAN SECTION HEADER CV:
13. BACA JUDUL SECTION di CV (misalnya "Work Experience", "Projects", "Education", "Skills", "Certifications", "Publications", "Organizations", "Achievements", dll).
14. "pengalaman" HANYA berisi item dari section yang berjudul Work Experience / Professional Experience / Pengalaman Kerja. Format: "[Posisi] di [Perusahaan] — [deskripsi singkat]". Gabungkan bullet points per posisi jadi 1 string ringkas, JANGAN copy semua bullet point satu per satu.
15. "publikasi" HANYA berisi item dari section Publications / Research / Penelitian.
16. "prestasi" HANYA berisi item dari section Achievements / Awards / Honors / Prestasi / Competitions.
17. "ekstrakurikuler" HANYA berisi item dari section Organizations / Activities / Volunteer / Ekstrakurikuler.
18. Item dari section "Projects" / "Portfolio" JANGAN masukkan ke pengalaman. Masukkan ke pengalaman HANYA jika project itu bagian dari pekerjaan (di bawah section Work Experience). Jika ada section Projects terpisah, abaikan atau ringkas 1 baris di notes.
19. Setiap entry di pengalaman harus berformat: "[Role/Posisi] di [Nama Perusahaan/Organisasi]" diikuti ringkasan singkat (1 kalimat). JANGAN list setiap bullet point terpisah.
20. Maksimal 5 item per array field (ambil yang paling relevan/impresif).`;


interface ParsedCV {
  tipe: "SMA" | "MAHASISWA" | null;
  // SMA fields
  kelas?: string | null;
  namaSekolah?: string | null;
  nilaiRataRata?: number | null;
  prestasi?: string[];
  ekstrakurikuler?: string[];
  // Mahasiswa fields
  jenjang?: string | null;
  jurusan?: string | null;
  universitas?: string | null;
  ipk?: number | null;
  toefl?: number | null;
  ielts?: number | null;
  pengalaman?: string[];
  publikasi?: string[];
  // Common
  targetJenjang?: string | null;
  targetNegara?: string[];
  targetBidang?: string[];
  butuhFinansial?: boolean;
  /** Gemini's confidence about this extraction */
  confidence?: "high" | "medium" | "low";
  /** Notes about the extraction */
  notes?: string;
}

/**
 * POST /api/profile/parse-cv
 * Body: multipart/form-data with field "cv" (PDF file)
 * Returns: { profile: ParsedCV }
 *
 * Uses Gemini 2.5 Flash multimodal to read PDF directly and extract structured profile data.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("cv");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File CV wajib diupload (field 'cv')" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File terlalu besar (maks 10 MB)" }, { status: 400 });
  }

  const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: "Hanya PDF atau gambar (PNG/JPG/WEBP) yang didukung" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    let parsed: ParsedCV;
    try {
      parsed = await generateJson<ParsedCV>(
        [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          {
            text: `Ekstrak CV ini menjadi JSON dengan struktur:
{
  "tipe": "SMA" | "MAHASISWA",
  "kelas": "10"|"11"|"12"|null,
  "namaSekolah": "..." | null,
  "nilaiRataRata": 85.5 | null,
  "prestasi": ["..."],
  "ekstrakurikuler": ["..."],
  "jenjang": "S1_AKTIF"|"FRESH_GRADUATE"|"S2_AKTIF"|null,
  "jurusan": "..." | null,
  "universitas": "..." | null,
  "ipk": 3.65 | null,
  "toefl": 90 | null,
  "ielts": 6.5 | null,
  "pengalaman": ["..."],
  "publikasi": ["..."],
  "targetJenjang": "S1"|"S2"|"S3"|null,
  "targetNegara": ["..."],
  "targetBidang": ["..."],
  "butuhFinansial": false,
  "confidence": "high"|"medium"|"low",
  "notes": "Catatan singkat tentang kualitas ekstraksi"
}`,
          },
        ],
        { systemInstruction: SYSTEM_PROMPT }
      );
    } catch (e) {
      if (e instanceof GeminiRateLimitError) {
        return NextResponse.json({
          error: "Server AI sedang sibuk (rate limit). Coba lagi beberapa saat lagi.",
        }, { status: 429 });
      }
      return NextResponse.json({
        error: `Gemini gagal memproses CV: ${(e as Error).message}`,
      }, { status: 500 });
    }

    // Sanitize numeric fields
    if (parsed.ipk != null && (parsed.ipk < 0 || parsed.ipk > 4)) parsed.ipk = null;
    if (parsed.nilaiRataRata != null && (parsed.nilaiRataRata < 0 || parsed.nilaiRataRata > 100)) parsed.nilaiRataRata = null;
    if (parsed.toefl != null && (parsed.toefl < 0 || parsed.toefl > 677)) parsed.toefl = null;
    if (parsed.ielts != null && (parsed.ielts < 0 || parsed.ielts > 9)) parsed.ielts = null;

    return NextResponse.json({ profile: parsed });
  } catch (e) {
    console.error("Parse CV failed:", e);
    return NextResponse.json({
      error: `Gagal parse CV: ${(e as Error).message}`,
    }, { status: 500 });
  }
}
