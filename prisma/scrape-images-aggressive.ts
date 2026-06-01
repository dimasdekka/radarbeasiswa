import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";
import { chromium } from "playwright-extra";
// @ts-ignore
import stealth from "puppeteer-extra-plugin-stealth";

(chromium as any).use(stealth());

const prisma = new PrismaClient();

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};

/**
 * Extract the BEST image from HTML.
 * Priority: og:image > twitter:image > apple-touch-icon (large) > largest img on page
 */
function extractBestImage(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);

  // 1. og:image (highest priority)
  const ogImage = $('meta[property="og:image"]').attr("content")
    || $('meta[property="og:image:url"]').attr("content")
    || $('meta[name="twitter:image"]').attr("content")
    || $('meta[name="twitter:image:src"]').attr("content");
  if (ogImage) {
    try {
      const abs = new URL(ogImage, baseUrl).href;
      return abs;
    } catch { /* ignore */ }
  }

  // 2. apple-touch-icon (usually 180x180, high quality logo)
  const appleIcon = $('link[rel="apple-touch-icon"]').attr("href")
    || $('link[rel="apple-touch-icon-precomposed"]').attr("href");
  if (appleIcon) {
    try {
      return new URL(appleIcon, baseUrl).href;
    } catch { /* ignore */ }
  }

  // 3. Find largest visible img (filter logos, ads, tracking)
  let bestImg: { src: string; area: number } | null = null;
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    if (src.startsWith("data:")) return;
    if (/sprite|tracking|pixel|spacer|blank/i.test(src)) return;
    if (/\.(svg|gif)(\?|$)/i.test(src)) return;
    const w = parseInt($(el).attr("width") || "0");
    const h = parseInt($(el).attr("height") || "0");
    const area = (w || 200) * (h || 200);
    if (area < 10000) return; // skip small icons
    try {
      const abs = new URL(src, baseUrl).href;
      if (!bestImg || area > bestImg.area) {
        bestImg = { src: abs, area };
      }
    } catch { /* ignore */ }
  });
  if (bestImg) return (bestImg as { src: string }).src;

  // 4. Fallback: high-res favicon
  const icon = $('link[rel="icon"][sizes]').attr("href") || $('link[rel="icon"]').attr("href");
  if (icon) {
    try {
      return new URL(icon, baseUrl).href;
    } catch { /* ignore */ }
  }

  return null;
}

/**
 * Try fetch first, then Playwright fallback for blocked sites.
 */
async function getPageHtml(url: string): Promise<string | null> {
  // Fast path: simple fetch
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      if (html.length > 500) return html;
    }
  } catch { /* fall through to playwright */ }

  // Slow path: Playwright with stealth
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: BROWSER_HEADERS["User-Agent"],
      locale: "id-ID",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 8000 });
    } catch { /* ignore */ }
    return await page.content();
  } catch (e) {
    console.warn(`  ! playwright failed: ${(e as Error).message.slice(0, 60)}`);
    return null;
  } finally {
    await browser.close();
  }
}

/**
 * Verify that an image URL actually loads (HEAD request).
 */
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "";
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

async function main() {
  const all = await prisma.beasiswa.findMany({
    select: { id: true, nama: true, urlResmi: true },
  });

  let success = 0, failed = 0;

  for (const b of all) {
    process.stdout.write(`→ ${b.nama.slice(0, 50).padEnd(50)} `);
    const html = await getPageHtml(b.urlResmi);
    if (!html) {
      console.log("✗ no html");
      failed++;
      continue;
    }

    const imageUrl = extractBestImage(html, b.urlResmi);
    if (!imageUrl) {
      console.log("✗ no image found");
      failed++;
      continue;
    }

    const valid = await verifyImageUrl(imageUrl);
    if (!valid) {
      console.log(`✗ image not loadable: ${imageUrl.slice(0, 50)}`);
      failed++;
      continue;
    }

    await prisma.beasiswa.update({
      where: { id: b.id },
      data: { imageUrl },
    });
    console.log(`✓ ${imageUrl.slice(0, 70)}`);
    success++;
  }

  console.log(`\nDone: ${success}/${all.length} success, ${failed} failed.`);
}

main().finally(() => prisma.$disconnect());
