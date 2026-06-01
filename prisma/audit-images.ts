import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Fetch an image URL and report status + content-type + size (bytes). */
async function probe(url: string): Promise<{ ok: boolean; status: number; type: string; bytes: number }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RadarBeasiswaBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    const buf = res.ok ? Buffer.from(await res.arrayBuffer()) : Buffer.alloc(0);
    return {
      ok: res.ok,
      status: res.status,
      type: res.headers.get("content-type") ?? "?",
      bytes: buf.byteLength,
    };
  } catch (e) {
    return { ok: false, status: 0, type: String((e as Error).message).slice(0, 40), bytes: 0 };
  }
}

async function main() {
  const rows = await prisma.beasiswa.findMany({
    where: { aktif: true },
    select: { id: true, nama: true, imageUrl: true, urlResmi: true },
    orderBy: { nama: "asc" },
  });

  console.log(`Auditing images for ${rows.length} active beasiswa\n`);

  let noImage = 0;
  let broken = 0;
  let tiny = 0;
  let ok = 0;

  for (const b of rows) {
    if (!b.imageUrl) {
      noImage++;
      console.log(`[NO IMAGE]  ${b.nama}`);
      continue;
    }
    const r = await probe(b.imageUrl);
    if (!r.ok) {
      broken++;
      console.log(`[BROKEN ${r.status}] ${b.nama}\n    ${b.imageUrl}\n    -> ${r.type}`);
    } else if (r.bytes < 6000) {
      // very small payloads = likely 1x1 trackers, tiny favicons, or grainy thumbs
      tiny++;
      console.log(`[TINY ${r.bytes}b] ${b.nama}\n    ${b.imageUrl}\n    -> ${r.type}`);
    } else {
      ok++;
    }
  }

  console.log(`\n==== SUMMARY ====`);
  console.log(`total:    ${rows.length}`);
  console.log(`ok:       ${ok}`);
  console.log(`no image: ${noImage}`);
  console.log(`broken:   ${broken}`);
  console.log(`tiny:     ${tiny}`);
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
