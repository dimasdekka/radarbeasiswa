import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { generateEmbedding, beasiswaToText } from "../src/lib/embedding";

const prisma = new PrismaClient();

async function main() {
  const list = await prisma.beasiswa.findMany({
    where: { aktif: true },
    select: {
      id: true, nama: true, provider: true, negara: true, jenjang: true,
      targetUser: true, cakupan: true, bidangStudi: true, bahasa: true,
      ipkMinimum: true, nilaiMinimum: true, toeflMinimum: true, ieltsMinimum: true,
      persyaratan: true,
    },
  });

  console.log(`🔮 Generating embeddings for ${list.length} beasiswa...`);

  for (const b of list) {
    const text = beasiswaToText(b);
    try {
      const vec = await generateEmbedding(text);
      const vecString = `[${vec.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "Beasiswa" SET embedding = $1::vector WHERE id = $2`,
        vecString,
        b.id
      );
      console.log(`  ✓ ${b.nama}`);
    } catch (e) {
      console.error(`  ✗ ${b.nama}:`, (e as Error).message);
    }
    // Rate limit guard for Gemini free tier
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n✅ Done. Verifying...`);
  const counts = await prisma.$queryRawUnsafe<{ total: number; with_embedding: number }[]>(
    `SELECT COUNT(*)::int as total, COUNT(embedding)::int as with_embedding FROM "Beasiswa" WHERE aktif = true`
  );
  console.log(counts[0]);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
