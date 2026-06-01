import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * WordPress.com mShots service: takes a screenshot of any URL.
 * Free, reliable, no API key needed. Caches screenshots on their CDN.
 * Format: https://s.wordpress.com/mshots/v1/{URL_ENCODED}?w=640&h=480
 */
function mshotsUrl(urlResmi: string): string {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(urlResmi)}?w=640&h=480`;
}

async function main() {
  const all = await prisma.beasiswa.findMany({
    select: { id: true, nama: true, urlResmi: true },
  });

  let updated = 0;
  for (const b of all) {
    const imageUrl = mshotsUrl(b.urlResmi);
    await prisma.beasiswa.update({
      where: { id: b.id },
      data: { imageUrl },
    });
    updated++;
    console.log(`✓ ${b.nama.slice(0, 50).padEnd(50)} → screenshot`);
  }
  console.log(`\nDone: ${updated} beasiswa updated with website screenshots.`);
}
main().finally(() => prisma.$disconnect());
