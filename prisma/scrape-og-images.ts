import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};

/**
 * Extract og:image / twitter:image from a URL.
 */
async function extractOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[property="og:image:url"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[name="twitter:image:src"]').attr("content"),
      $('link[rel="image_src"]').attr("href"),
    ].filter(Boolean) as string[];

    for (const c of candidates) {
      try {
        return new URL(c, url).href;
      } catch { /* ignore */ }
    }
    return null;
  } catch (e) {
    console.warn(`  ! ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const all = await prisma.beasiswa.findMany({
    select: { id: true, nama: true, urlResmi: true },
  });

  let success = 0, failed = 0;

  for (const b of all) {
    process.stdout.write(`→ ${b.nama.slice(0, 50).padEnd(50)} `);
    const ogImage = await extractOgImage(b.urlResmi);
    if (ogImage) {
      await prisma.beasiswa.update({
        where: { id: b.id },
        data: { imageUrl: ogImage },
      });
      console.log(`✓ ${ogImage.slice(0, 70)}`);
      success++;
    } else {
      console.log(`✗ no og:image`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} success, ${failed} failed.`);
}

main().finally(() => prisma.$disconnect());
