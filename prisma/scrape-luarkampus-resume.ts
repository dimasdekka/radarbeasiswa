import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";
import { generateJson, GeminiRateLimitError } from "@/lib/gemini";

const prisma = new PrismaClient();

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

async function researchWithRetry(item: ListingItem, maxRetries = 3): Promise<unknown | null> {
  const systemInstruction = `Asisten data beasiswa Indonesia. Output JSON valid (tanpa markdown fence). negara dalam Bahasa Indonesia. jenjang: S1/S2/S3. targetUser: SMA/MAHASISWA. Jangan mengarang.`;

  const prompt = `Beasiswa: ${item.name}
URL: ${item.url}
Negara: ${item.countries.join(", ")}
Jenjang: ${item.degrees.join(", ")}
Open: ${item.open_date ?? "-"}, Close: ${item.close_date ?? "-"}

Output JSON: {"nama","provider","negara","jenjang":[],"targetUser":[],"deadline":"YYYY-MM-DD"|null,"deadlineNote":null,"cakupan":[],"ipkMinimum":null,"toeflMinimum":null,"ieltsMinimum":null,"bidangStudi":[],"bahasa":[],"persyaratan":{"umum":[],"dokumen":[]},"checklistDok":[],"urlResmi":"${item.url}","imageUrl":null,"confidence":"high"|"medium"|"low"}`;

  // generateJson already retries with exponential backoff + model fallback,
  // so a single attempt here is enough; keep maxRetries as an outer safety net.
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateJson(prompt, { systemInstruction });
    } catch (e) {
      if (e instanceof GeminiRateLimitError) {
        const waitSec = attempt * 30;
        console.log(`  ⏸ rate limit, waiting ${waitSec}s...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      } else {
        console.warn(`  ! ${(e as Error).message.slice(0, 80)}`);
        return null;
      }
    }
  }
  return null;
}

async function main() {
  // Build full list from all pages first
  console.log("Collecting all listings...");
  const allItems: ListingItem[] = [];
  for (let page = 1; page <= 12; page++) {
    try {
      const items = await scrapeListingPage(page);
      allItems.push(...items);
      console.log(`  page ${page}: ${items.length} items`);
    } catch (e) {
      console.warn(`  page ${page} failed: ${(e as Error).message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`Total: ${allItems.length} listings\n`);

  // Filter out already-scraped
  const existing = await prisma.scrapedScholarship.findMany({
    select: { sourceUrl: true },
  });
  const existingBeasiswa = await prisma.beasiswa.findMany({
    select: { nama: true },
  });
  const seenUrls = new Set(existing.map(e => e.sourceUrl));
  const seenNames = new Set(existingBeasiswa.map(e => e.nama.toLowerCase()));

  const todo = allItems.filter(i => !seenUrls.has(i.url) && !seenNames.has(i.name.toLowerCase()));
  console.log(`To process: ${todo.length} (${allItems.length - todo.length} already done)\n`);

  let saved = 0, failed = 0;
  // Process with 5-second delay between requests to stay under 15 RPM
  for (let i = 0; i < todo.length; i++) {
    const item = todo[i];
    process.stdout.write(`[${i + 1}/${todo.length}] ${item.name.slice(0, 55).padEnd(55)} `);

    const data = await researchWithRetry(item);
    if (!data) {
      console.log("✗");
      failed++;
      continue;
    }

    try {
      await prisma.scrapedScholarship.create({
        data: {
          sourceName: "luarkampus.id",
          sourceUrl: item.url,
          rawTitle: item.name,
          rawContent: `${item.name} | ${item.countries.join(", ")} | ${item.degrees.join(", ")}`,
          normalizedData: data as object,
          status: "PENDING_REVIEW",
        },
      });
      const conf = (data as { confidence?: string }).confidence ?? "?";
      console.log(`✓ ${conf}`);
      saved++;
    } catch (e) {
      console.log(`✗ db: ${(e as Error).message.slice(0, 50)}`);
      failed++;
    }

    // Rate limit: 5 sec between requests = 12 RPM (under 15 limit)
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\n━━━ Summary ━━━`);
  console.log(`Saved:  ${saved}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nApprove via /admin/scraping-review`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
