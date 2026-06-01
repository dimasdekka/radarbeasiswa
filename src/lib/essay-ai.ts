import type { Beasiswa, Profile } from "@prisma/client";
import { generateText, generateJson } from "@/lib/gemini";

export interface GuidedQuestion {
  id: string;
  question: string;
  hint: string;
}

export interface ParagraphFeedback {
  index: number;
  preview: string;
  score: number;
  comment: string;
  suggestion: string;
}

/**
 * Generate 4-6 guided questions based on the essay rubric and beasiswa.
 * Per PRD section 4.7 — AI memberikan 4–6 guided questions.
 */
export async function generateGuidedQuestions(
  beasiswa: Beasiswa,
  essayTitle: string
): Promise<GuidedQuestion[]> {
  const rubrik = beasiswa.rubrikEssay
    ? JSON.stringify(beasiswa.rubrikEssay, null, 2)
    : "Tidak ada rubrik spesifik. Buat pertanyaan untuk essay motivasi standar (background, motivasi, rencana studi, kontribusi).";

  const prompt = `Kamu adalah konsultan beasiswa. Buat 4-6 pertanyaan terpandu (guided questions) dalam Bahasa Indonesia untuk essay berikut.

BEASISWA: ${beasiswa.nama} (${beasiswa.provider}, ${beasiswa.negara})
JUDUL ESSAY: ${essayTitle}
RUBRIK PENILAIAN:
${rubrik}

Pertanyaan harus:
- Membantu pengguna mengeluarkan pengalaman dan motivasi spesifik dari hidupnya
- Menyentuh setiap aspek rubrik
- Mudah dijawab dalam 2-4 kalimat per pertanyaan
- Dimulai dari pertanyaan ringan (background) ke pertanyaan strategis (rencana, kontribusi)

Output JSON array tanpa markdown:
[{"id":"q1","question":"...","hint":"contoh jawaban singkat 1 kalimat"},...]`;

  return await generateJson<GuidedQuestion[]>(prompt);
}

/**
 * Generate a draft essay from the user's answers to guided questions.
 * Per PRD section 4.7 — AI generate draft essay berdasarkan jawaban user dan rubrik.
 */
export async function generateEssayDraft(
  beasiswa: Beasiswa,
  profile: Profile,
  essayTitle: string,
  answers: { question: string; answer: string }[]
): Promise<string> {
  const rubrik = beasiswa.rubrikEssay
    ? JSON.stringify(beasiswa.rubrikEssay, null, 2)
    : "Essay motivasi standar.";

  const profileSummary =
    profile.tipe === "MAHASISWA"
      ? `${profile.jurusan ?? "—"} di ${profile.universitas ?? "—"}, IPK ${profile.ipk ?? "—"}`
      : `Siswa SMA kelas ${profile.kelas ?? "—"}, nilai rapor ${profile.nilaiRataRata ?? "—"}`;

  const answersBlock = answers
    .map((a, i) => `${i + 1}. ${a.question}\n   Jawaban: ${a.answer}`)
    .join("\n\n");

  const prompt = `Kamu adalah penulis profesional yang membantu pelamar beasiswa. Tulis draft essay dalam Bahasa Indonesia berdasarkan jawaban pengguna terhadap guided questions.

BEASISWA: ${beasiswa.nama} (${beasiswa.provider}, ${beasiswa.negara})
JUDUL ESSAY: ${essayTitle}
PROFIL: ${profileSummary}
RUBRIK:
${rubrik}

JAWABAN PENGGUNA:
${answersBlock}

ATURAN:
- Tulis 3-5 paragraf yang mengalir natural
- Setiap paragraf 4-6 kalimat
- Gunakan kata "saya" dan tone personal namun profesional
- Tunjukkan, jangan hanya beri tahu (gunakan contoh konkret dari jawaban)
- Penuhi semua aspek rubrik
- TIDAK perlu judul atau subjudul, langsung paragraf isi
- Tulis dalam Bahasa Indonesia formal

Output: hanya teks essay, paragraf dipisahkan baris kosong.`;

  const text = await generateText(prompt);
  return text.trim();
}

/**
 * Generate per-paragraph feedback in Indonesian, with score 1-10 and suggestions.
 * Per PRD section 4.8.
 */
export async function generateEssayFeedback(
  beasiswa: Beasiswa,
  essayTitle: string,
  essayContent: string
): Promise<ParagraphFeedback[]> {
  const rubrik = beasiswa.rubrikEssay
    ? JSON.stringify(beasiswa.rubrikEssay, null, 2)
    : "Essay motivasi umum.";

  const prompt = `Kamu adalah reviewer essay beasiswa berpengalaman. Berikan feedback per paragraf dalam Bahasa Indonesia.

BEASISWA: ${beasiswa.nama}
JUDUL ESSAY: ${essayTitle}
RUBRIK:
${rubrik}

ESSAY:
${essayContent}

Bagi essay menjadi paragraf (paragraph berbasis double newline). Untuk setiap paragraf:
- Berikan skor 1-10
- Komentar 1 kalimat (apa yang sudah baik dan apa yang lemah)
- Saran 1-2 kalimat yang sangat actionable

Output JSON array tanpa markdown:
[{"index":1,"preview":"5 kata pertama paragraf...","score":7,"comment":"...","suggestion":"..."},...]`;

  return await generateJson<ParagraphFeedback[]>(prompt);
}
