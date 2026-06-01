import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // All SCRAPED entries
  const scraped = await prisma.beasiswa.findMany({
    where: { sourceType: "SCRAPED" },
    select: { id: true, nama: true, provider: true, urlResmi: true, sourceUrl: true, verified: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`📋 ${scraped.length} SCRAPED beasiswa records\n`);
  for (const b of scraped) {
    console.log("---");
    console.log("nama     :", b.nama);
    console.log("provider :", b.provider);
    console.log("urlResmi :", b.urlResmi);
    console.log("sourceUrl:", b.sourceUrl);
    console.log("verified :", b.verified);
    console.log("created  :", b.createdAt.toISOString());
  }

  // Also check all ScrapedScholarship for context (admin record + normalizedData)
  const allScraped = await prisma.scrapedScholarship.findMany({
    select: { id: true, sourceName: true, sourceUrl: true, status: true, normalizedData: true, scrapedAt: true },
    orderBy: { scrapedAt: "desc" },
    take: 30,
  });

  console.log(`\n\n📋 Recent ${allScraped.length} ScrapedScholarship records\n`);
  for (const s of allScraped) {
    const n = s.normalizedData as { nama?: string; urlResmi?: string } | null;
    console.log("---");
    console.log("source   :", s.sourceName);
    console.log("status   :", s.status);
    console.log("nama     :", n?.nama ?? "(none)");
    console.log("urlResmi :", n?.urlResmi ?? "(none)");
    console.log("sourceUrl:", s.sourceUrl);
  }
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
