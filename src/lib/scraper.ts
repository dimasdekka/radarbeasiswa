import * as cheerio from "cheerio";

export interface ScrapedRaw {
  url: string;
  title: string;
  content: string;
  /** og:image, twitter:image, or other prominent banner — the "share image" of the page */
  ogImage: string | null;
  images: string[];
  /** "cheerio" if static fetch worked, "playwright" if we used a real browser */
  method: "cheerio" | "playwright";
}

/**
 * Realistic browser headers — many sites (LPDP, MEXT) reject default fetch UA.
 * Mimicking Chrome on Windows.
 */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Ch-Ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

/**
 * Threshold below which we consider a Cheerio result too thin
 * and try Playwright fallback (likely an SPA).
 */
const MIN_CONTENT_LENGTH = 500;

/**
 * Try fetch + Cheerio first (fast). If response is too thin or blocked,
 * fall back to Playwright (slow, but handles JS-heavy SPAs and bot-blocked sites).
 */
export async function scrapePage(url: string): Promise<ScrapedRaw> {
  // 1. Try Cheerio first (fast path)
  let cheerioFailed = false;
  try {
    const result = await scrapeWithCheerio(url);
    if (result.content.length >= MIN_CONTENT_LENGTH) {
      return result;
    }
    cheerioFailed = true;
  } catch (e) {
    cheerioFailed = true;
    console.warn(`[scraper] Cheerio failed for ${url}: ${(e as Error).message}. Trying Playwright...`);
  }

  if (cheerioFailed) {
    // 2. Fall back to Playwright (slow but full JS rendering)
    try {
      return await scrapeWithPlaywright(url);
    } catch (e) {
      throw new Error(`Both Cheerio and Playwright failed: ${(e as Error).message}`);
    }
  }

  // Should not reach here
  throw new Error("Unreachable");
}

/**
 * Static fetch + Cheerio extraction.
 */
async function scrapeWithCheerio(url: string): Promise<ScrapedRaw> {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(20000),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const html = await res.text();
  return parseHtml(html, url, "cheerio");
}

/**
 * Playwright fetch — runs a real headless browser with stealth mode.
 * playwright-extra + stealth plugin removes most "headless" tells:
 *  - navigator.webdriver
 *  - chrome.runtime
 *  - plugins/mimeTypes
 *  - WebGL vendor strings
 *  - permissions API quirks
 * This dramatically improves success rate on Cloudflare-protected sites.
 */
async function scrapeWithPlaywright(url: string): Promise<ScrapedRaw> {
  // Lazy import so Cheerio-only hosts don't pay the bundle cost.
  const { chromium } = await import("playwright-extra");
  // Default-import stealth plugin (CommonJS module)
  const stealthMod = await import("puppeteer-extra-plugin-stealth");
  const stealth = (stealthMod as { default?: () => unknown }).default ?? stealthMod;
  // Plugin types are loose in playwright-extra; cast through unknown
  (chromium as unknown as { use: (p: unknown) => void }).use((stealth as () => unknown)());

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--no-sandbox",
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent: BROWSER_HEADERS["User-Agent"],
      locale: "id-ID",
      timezoneId: "Asia/Jakarta",
      extraHTTPHeaders: {
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait briefly for JS-rendered content (Cloudflare challenge etc.)
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      // Some pages never go networkidle (live pings) — proceed anyway
    }

    // Tiny human-like delay so bot detection sees "settle" time
    await page.waitForTimeout(500);

    const html = await page.content();
    return parseHtml(html, url, "playwright");
  } finally {
    await browser.close();
  }
}

/**
 * Extract title + main content from HTML using Cheerio.
 */
function parseHtml(html: string, url: string, method: "cheerio" | "playwright"): ScrapedRaw {
  const $ = cheerio.load(html);

  // Extract og:image / twitter:image — the "share image" which is usually a banner/hero
  const ogCandidates = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[property="og:image:url"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('meta[name="twitter:image:src"]').attr("content"),
    $('link[rel="image_src"]').attr("href"),
  ].filter(Boolean) as string[];

  let ogImage: string | null = null;
  for (const candidate of ogCandidates) {
    try {
      ogImage = new URL(candidate, url).href;
      break;
    } catch { /* ignore */ }
  }

  // Extract content images as fallback
  const images: string[] = [];
  $("img[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    try {
      const abs = new URL(src, url).href;
      if (abs.startsWith("data:")) return;
      if (/\.(svg|gif)$/i.test(abs)) return;
      const w = parseInt($(el).attr("width") || "0");
      const h = parseInt($(el).attr("height") || "0");
      if (w > 0 && w < 100) return;
      if (h > 0 && h < 100) return;
      images.push(abs);
    } catch { /* invalid URL */ }
  });

  $("script, style, noscript, nav, footer, header, aside, form, iframe").remove();

  const title = $("title").first().text().trim() || $("h1").first().text().trim();

  const article =
    $("article").first().text() ||
    $("main").first().text() ||
    $('[role="main"]').first().text() ||
    $(".content, #content, .post, .article, .entry-content").first().text() ||
    $("body").text();

  const cleanedContent = article
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 12000);

  return {
    url,
    title: title.slice(0, 300),
    content: cleanedContent,
    ogImage,
    images: images.slice(0, 5),
    method,
  };
}
