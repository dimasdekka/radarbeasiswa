import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};

/** A URL that is clearly a favicon/icon/sprite and would look grainy stretched. */
function isWeakImage(url: string): boolean {
  const u = url.toLowerCase();
  if (/favicon|sprite|spinner|loader/.test(u)) return true;
  // icon-48x48, icon_32, apple-touch-icon, logo-32, 1x1 etc.
  if (/(icon|logo)[-_]?\d{1,3}x\d{1,3}/.test(u)) return true;
  if (/[-_](16|24|32|48|64)x(16|24|32|48|64)/.test(u)) return true;
  if (/apple-touch-icon|mstile|android-chrome-(48|72|96)/.test(u)) return true;
  return false;
}

/** Fetch a candidate image and decide if it is a usable, non-grainy banner. */
async function validateImage(url: string): Promise<boolean> {
  if (isWeakImage(url)) return false;
  try {
    const res = await fetch(url, {
      headers: { ...BROWSER_HEADERS, Referer: new URL(url).origin },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    // Reject anything under ~8KB (favicons / 1x1 trackers / tiny grainy thumbs).
    if (buf.byteLength < 8000) return false;
    return true;
  } catch {
    return false;
  }
}

/** Extract ordered og/twitter/link image candidates from a page. */
async function extractCandidates(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    const raw = [
      $('meta[property="og:image:secure_url"]').attr("content"),
      $('meta[property="og:image"]').attr("content"),
      $('meta[property="og:image:url"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[name="twitter:image:src"]').attr("content"),
      $('link[rel="image_src"]').attr("href"),
    ].filter(Boolean) as string[];

    const abs: string[] = [];
    for (const c of raw) {
      try {
        abs.push(new URL(c, url).href);
      } catch {
        /* ignore */
      }
    }
    return Array.from(new Set(abs));
  } catch {
    return [];
  }
}

async function main() {
  const rows = await prisma.beasiswa.findMany({
    where: { aktif: true },
    select: { id: true, nama: true, imageUrl: true, urlResmi: true },
    orderBy: { nama: "asc" },
  });

  console.log(`Smart image fix for ${rows.length} beasiswa\n`);

  let kept = 0,
    replaced = 0,
    cleared = 0;

  for (const b of rows) {
    const label = b.nama.slice(0, 46).padEnd(46);

    // 1. Is the current image already good?
    if (b.imageUrl && (await validateImage(b.imageUrl))) {
      console.log(`= ${label} keep (current ok)`);
      kept++;
      continue;
    }

    // 2. Try to scrape a better og:image from the official site.
    let chosen: string | null = null;
    if (b.urlResmi) {
      const candidates = await extractCandidates(b.urlResmi);
      for (const c of candidates) {
        if (await validateImage(c)) {
          chosen = c;
          break;
        }
      }
    }

    if (chosen) {
      await prisma.beasiswa.update({ where: { id: b.id }, data: { imageUrl: chosen } });
      console.log(`+ ${label} -> ${chosen.slice(0, 60)}`);
      replaced++;
    } else {
      // 3. No good banner: clear it so the clean centered-logo fallback renders
      //    instead of a stretched grainy favicon / broken image.
      if (b.imageUrl !== null) {
        await prisma.beasiswa.update({ where: { id: b.id }, data: { imageUrl: null } });
        cleared++;
      }
      console.log(`x ${label} cleared (fallback to logo)`);
    }
  }

  console.log(`\n==== SUMMARY ====`);
  console.log(`kept:     ${kept}`);
  console.log(`replaced: ${replaced}`);
  console.log(`cleared:  ${cleared}`);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
