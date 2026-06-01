import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI-powered scholarship discovery using Gemini's built-in Google Search
 * grounding. Gemini performs real Google searches, reads the results, and we
 * harvest the grounding source URLs — which then feed the normal scrape →
 * normalize → review pipeline.
 *
 * This is "AI yang research sendiri di Google lalu kita scrape".
 */

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

export interface DiscoveredScholarship {
  nama: string;
  provider: string;
  negara: string;
  url: string;
}

export interface ResearchResult {
  scholarships: DiscoveredScholarship[];
  /** Raw grounding source URLs Gemini actually used (for scraping). */
  sources: { title: string; url: string }[];
  summary: string;
}

const DEFAULT_QUERY =
  "beasiswa terbaru untuk pelajar dan mahasiswa Indonesia (S1, S2, S3) dalam dan luar negeri yang pendaftarannya sedang atau akan dibuka";

/**
 * Ask Gemini (with Google Search grounding) to find current scholarships and
 * return both a structured list and the real source URLs it grounded on.
 */
export async function researchScholarships(query?: string): Promise<ResearchResult> {
  const q = query?.trim() || DEFAULT_QUERY;

  // Gemini 2.0+/2.5 expose the built-in Google Search tool. Casting because the
  // SDK's TS types lag behind the API for the `googleSearch` tool.
  const model = getGenAI().getGenerativeModel(
    {
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }],
    } as unknown as Parameters<GoogleGenerativeAI["getGenerativeModel"]>[0]
  );

  const prompt = `Cari di Google: ${q}.

Tugas: temukan 8-15 beasiswa NYATA yang relevan untuk pelajar/mahasiswa Indonesia.
Untuk setiap beasiswa, sebutkan nama, penyelenggara, negara tujuan, dan URL halaman resmi/pendaftarannya.

Setelah itu, di akhir jawaban, tulis blok JSON (dibungkus dalam \`\`\`json) berisi array:
[{"nama":"...","provider":"...","negara":"...","url":"https://..."}]

Hanya masukkan beasiswa yang URL-nya kamu temukan dari hasil pencarian. Jangan mengarang URL.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Extract grounding source URLs (the real pages Gemini used).
  const sources: { title: string; url: string }[] = [];
  type GroundingChunk = { web?: { uri?: string; title?: string } };
  const meta = (response.candidates?.[0] as { groundingMetadata?: { groundingChunks?: GroundingChunk[] } } | undefined)
    ?.groundingMetadata;
  for (const chunk of meta?.groundingChunks ?? []) {
    const uri = chunk.web?.uri;
    if (uri) sources.push({ title: chunk.web?.title ?? uri, url: uri });
  }

  // Parse the structured JSON block if present.
  let scholarships: DiscoveredScholarship[] = [];
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (Array.isArray(parsed)) {
        scholarships = parsed
          .filter((s) => s && s.nama && s.url)
          .map((s) => ({
            nama: String(s.nama),
            provider: String(s.provider ?? ""),
            negara: String(s.negara ?? ""),
            url: String(s.url),
          }));
      }
    } catch {
      /* ignore parse errors; we still have grounding sources */
    }
  }

  const summary = text.replace(/```json[\s\S]*?```/i, "").trim().slice(0, 600);

  return { scholarships, sources, summary };
}
