import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
};

interface ListingItem {
  id: number;
  name: string;
  url: string;
  countries: string[];
  degrees: string[];
  open_date?: string;
  close_date?: string;
}

interface ResearchedScholarship {
  nama: string;
  provider: string;
  negara: string;
  jenjang: string[];
  targetUser: string[];
  deadline: string | null;
  deadlineNote: string | null;
  cakupan: string[];
  ipkMinimum: number | null;
  toeflMinimum: number | null;
  ieltsMinimum: number | null;
  bidangStudi: string[];
  bahasa: string[];
  persyaratan: { umum: string[]; dokumen: string[] };
  checklistDok: string[];
  urlResmi: string;
  imageUrl: string | null;
  confidence: "high" | "medium" | "low";
}

/**
 * Scrape one luarkampus.id listing page, extract entries from wire:snapshot JSON.
 */
async function scrapeListingPage(page: number): Promise<ListingItem[]> {
  const url = `https://luarkampus.id/beasiswa?page=${page}`;
  const res = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const items: ListingItem[] = [];
  $('a[href^="https://luarkampus.id/beasiswa/"]').each((_, el) => {
    const snapshot = $(el).attr("wire:snapshot");
    if (!snapshot) return;
    try {
      // Decode HTML entities first
      const decoded = snapshot
        .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#039;/g, "'");
      const parsed = JSON.parse(decoded);
      const d = parsed.data;
      if (!d?.name || !d?.url) return;
      items.push({
        id: d.scholarship_id,
        name: d.name,
        url: d.url,
        countries: (d.countries?.[0] ?? []).flat(),
        degrees: (d.degrees?.[0] ?? []).flat(),
        open_date: d.open_date,
        close_date: d.close_date,
      });
    } catch { /* ignore */ }
  });
  return items;
}

/**
 * Use Gemini's web knowledge to research a scholarship by name.
 * Returns full structured data without needing to scrape detail pages.
 */
async function researchScholarship(item: ListingItem): Promise<ResearchedScholarship | null> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `Kamu adalah asisten data beasiswa Indonesia. Berdasarkan nama beasiswa dan info dasar, cari informasi terlengkap dan ekstrak ke JSON.

ATURAN:
1. JANGAN mengarang. Kalau gak yakin, set null/[].
2. Output JSON valid, tanpa markdown fence.
3. negara dalam Bahasa Indonesia (contoh: "Inggris" bukan "United Kingdom").
4. jenjang hanya: "S1", "S2", "S3".
5. targetUser hanya: "SMA", "MAHASISWA".
6. deadline format YYYY-MM-DD, atau null kalau gak jelas.
7. confidence: "high" jika beasiswa terkenal/jelas, "medium" jika kurang info, "low" jika ragu.`,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Cari info beasiswa ini:
Nama: ${item.name}
URL: ${item.url}
Negara: ${item.countries.join(", ")}
Jenjang: ${item.degrees.join(", ")}
Open: ${item.open_date ?? "-"}
Close: ${item.close_date ?? "-"}

Ekstrak ke JSON:
{
  "nama": "...",
  "provider": "Lembaga penyelenggara",
  "negara": "Indonesia",
  "jenjang": ["S1","S2"],
  "targetUser": ["MAHASISWA"],
  "deadline": "YYYY-MM-DD" | null,
  "deadlineNote": "Catatan" | null,
  "cakupan": ["Biaya kuliah penuh", "Tunjangan hidup"],
  "ipkMinimum": 3.0 | null,
  "toeflMinimum": 80 | null,
  "ieltsMinimum": 6.5 | null,
  "bidangStudi": ["..."],
  "bahasa": ["Indonesia","Inggris"],
  "persyaratan": { "umum": ["..."], "dokumen": ["..."] },
  "checklistDok": ["KTP","Transkrip","Ijazah"],
  "urlResmi": "${item.url}",
  "imageUrl": null,
  "confidence": "high"|"medium"|"low"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(text) as ResearchedScholarship;
  } catch (e) {
    console.warn(`  ! Gemini failed: ${(e as Error).message.slice(0, 80)}`);
    return null;
  }
}

/**
 * Save researched data as ScrapedScholarship (PENDING_REVIEW for admin).
 */
async function saveScraped(item: ListingItem, data: ResearchedScholarship) {
  // Check if already exists in Beasiswa or ScrapedScholarship
  const existing = await prisma.beasiswa.findFirst({
    where: {
      OR: [
        { nama: { equals: data.nama, mode: "insensitive" } },
        { sourceUrl: item.url },
      ],
    },
    select: { id: true },
  });
  if (existing) return "duplicate";

  const existingScraped = await prisma.scrapedScholarship.findFirst({
    where: { sourceUrl: item.url },
    select: { id: true },
  });
  if (existingScraped) return "already-scraped";

  await prisma.scrapedScholarship.create({
    data: {
      sourceName: "luarkampus.id",
      sourceUrl: item.url,
      rawTitle: item.name,
      rawContent: `Listing: ${item.name}\nNegara: ${item.countries.join(", ")}\nJenjang: ${item.degrees.join(", ")}\nOpen: ${item.open_date}\nClose: ${item.close_date}`,
      normalizedData: data as object,
      status: "PENDING_REVIEW",
    },
  });
  return "saved";
}

async function main() {
  const TOTAL_PAGES = 12;
  let totalListed = 0, totalResearched = 0, totalSaved = 0, totalDup = 0;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`\n━━━ Page ${page}/${TOTAL_PAGES} ━━━`);
    let items: ListingItem[];
    try {
      items = await scrapeListingPage(page);
    } catch (e) {
      console.error(`Page ${page} failed: ${(e as Error).message}`);
      continue;
    }
    console.log(`Found ${items.length} listings`);
    totalListed += items.length;

    for (const item of items) {
      process.stdout.write(`→ ${item.name.slice(0, 60).padEnd(60)} `);
      const data = await researchScholarship(item);
      if (!data) { console.log("✗ research failed"); continue; }
      totalResearched++;

      const status = await saveScraped(item, data);
      if (status === "saved") {
        console.log(`✓ saved (${data.confidence})`);
        totalSaved++;
      } else if (status === "duplicate") {
        console.log("○ duplicate");
        totalDup++;
      } else {
        console.log("○ already scraped");
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 800));
    }
  }

  console.log(`\n━━━ Summary ━━━`);
  console.log(`Listed:     ${totalListed}`);
  console.log(`Researched: ${totalResearched}`);
  console.log(`Saved:      ${totalSaved}`);
  console.log(`Duplicates: ${totalDup}`);
  console.log(`\nNext step: open /admin/scraping-review to approve.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
