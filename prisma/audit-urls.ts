import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ASSET_EXT = /\.(png|jpe?g|gif|svg|webp|pdf|doc|docx|xls|xlsx|zip|mp4|mov)(\?.*)?$/i;

async function main() {
  const beasiswa = await prisma.beasiswa.findMany({
    where: { aktif: true },
    select: { id: true, nama: true, provider: true, urlResmi: true, sourceType: true, sourceUrl: true },
  });

  console.log(`📋 Audit ${beasiswa.length} beasiswa urlResmi values...\n`);

  const issues: typeof beasiswa = [];
  for (const b of beasiswa) {
    if (!b.urlResmi || ASSET_EXT.test(b.urlResmi) || !/^https?:\/\//i.test(b.urlResmi)) {
      issues.push(b);
      console.log(`⚠️  ${b.nama}`);
      console.log(`    urlResmi: ${b.urlResmi}`);
      console.log(`    sourceUrl: ${b.sourceUrl ?? "(none)"}`);
      console.log(`    sourceType: ${b.sourceType}\n`);
    }
  }

  if (issues.length === 0) {
    console.log("✅ Semua urlResmi terlihat valid");
  } else {
    console.log(`\nFound ${issues.length} issues out of ${beasiswa.length}`);
  }
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
