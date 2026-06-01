import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Use Google's favicon API which is 100% reliable for any domain.
 * Format: https://www.google.com/s2/favicons?domain=DOMAIN&sz=128
 */
function faviconUrl(urlResmi: string): string | null {
  try {
    const domain = new URL(urlResmi).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

async function main() {
  const all = await prisma.beasiswa.findMany({ select: { id: true, nama: true, urlResmi: true } });
  let updated = 0;
  for (const b of all) {
    const imageUrl = faviconUrl(b.urlResmi);
    if (imageUrl) {
      await prisma.beasiswa.update({ where: { id: b.id }, data: { imageUrl } });
      updated++;
      console.log(`✓ ${b.nama.slice(0, 40).padEnd(40)} → ${imageUrl}`);
    }
  }
  console.log(`\nDone: ${updated}/${all.length} updated`);
}
main().finally(() => prisma.$disconnect());
