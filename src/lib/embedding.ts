import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

/**
 * Generate a 768-dim embedding for a given text using gemini-embedding-001.
 * Used per PRD section 4.4 for matching profile vs beasiswa via pgvector.
 *
 * Note: PRD specifies text-embedding-004 but Google has moved to gemini-embedding-001.
 * We request 768-dim output to match our pgvector(768) column.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: "gemini-embedding-001" });
  // outputDimensionality is supported by the API but missing from the SDK's TS types.
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    outputDimensionality: 768,
  } as Parameters<typeof model.embedContent>[0]);
  return result.embedding.values;
}

/**
 * Build a textual representation of a user profile for embedding.
 */
export function profileToText(profile: {
  tipe: string;
  kelas?: string | null;
  jurusan?: string | null;
  universitas?: string | null;
  ipk?: number | null;
  nilaiRataRata?: number | null;
  toefl?: number | null;
  ielts?: number | null;
  prestasi?: string[];
  ekstrakurikuler?: string[];
  pengalaman?: string[];
  publikasi?: string[];
  targetJenjang?: string | null;
  targetNegara?: string[];
  targetBidang?: string[];
  butuhFinansial?: boolean;
}): string {
  const parts: string[] = [];

  parts.push(`Tipe: ${profile.tipe}`);

  if (profile.tipe === "SMA") {
    if (profile.kelas) parts.push(`Kelas: ${profile.kelas}`);
    if (profile.nilaiRataRata) parts.push(`Nilai rapor: ${profile.nilaiRataRata}`);
  } else {
    if (profile.jurusan) parts.push(`Jurusan: ${profile.jurusan}`);
    if (profile.universitas) parts.push(`Universitas: ${profile.universitas}`);
    if (profile.ipk) parts.push(`IPK: ${profile.ipk}`);
    if (profile.toefl) parts.push(`TOEFL: ${profile.toefl}`);
    if (profile.ielts) parts.push(`IELTS: ${profile.ielts}`);
  }

  if (profile.prestasi?.length) parts.push(`Prestasi: ${profile.prestasi.join(", ")}`);
  if (profile.ekstrakurikuler?.length) parts.push(`Ekstrakurikuler: ${profile.ekstrakurikuler.join(", ")}`);
  if (profile.pengalaman?.length) parts.push(`Pengalaman: ${profile.pengalaman.join(", ")}`);
  if (profile.publikasi?.length) parts.push(`Publikasi: ${profile.publikasi.join(", ")}`);

  if (profile.targetJenjang) parts.push(`Target jenjang: ${profile.targetJenjang}`);
  if (profile.targetNegara?.length) parts.push(`Target negara: ${profile.targetNegara.join(", ")}`);
  if (profile.targetBidang?.length) parts.push(`Target bidang: ${profile.targetBidang.join(", ")}`);
  if (profile.butuhFinansial) parts.push("Membutuhkan beasiswa full-funded");

  return parts.join(". ");
}

/**
 * Build a textual representation of a beasiswa for embedding.
 */
export function beasiswaToText(b: {
  nama: string;
  provider: string;
  negara: string;
  jenjang: string[];
  targetUser: string[];
  cakupan: string[];
  bidangStudi: string[];
  bahasa: string[];
  ipkMinimum?: number | null;
  nilaiMinimum?: number | null;
  toeflMinimum?: number | null;
  ieltsMinimum?: number | null;
  persyaratan?: unknown;
}): string {
  const parts: string[] = [
    `Beasiswa ${b.nama} dari ${b.provider}`,
    `Negara: ${b.negara}`,
    `Jenjang: ${b.jenjang.join(", ")}`,
    `Target: ${b.targetUser.join(", ")}`,
    `Cakupan: ${b.cakupan.join(", ")}`,
    `Bidang studi: ${b.bidangStudi.join(", ")}`,
    `Bahasa: ${b.bahasa.join(", ")}`,
  ];

  if (b.ipkMinimum) parts.push(`Minimum IPK ${b.ipkMinimum}`);
  if (b.nilaiMinimum) parts.push(`Minimum nilai rapor ${b.nilaiMinimum}`);
  if (b.toeflMinimum) parts.push(`Minimum TOEFL ${b.toeflMinimum}`);
  if (b.ieltsMinimum) parts.push(`Minimum IELTS ${b.ieltsMinimum}`);

  if (b.persyaratan && typeof b.persyaratan === "object") {
    parts.push(`Persyaratan: ${JSON.stringify(b.persyaratan)}`);
  }

  return parts.join(". ");
}
