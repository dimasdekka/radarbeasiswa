import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tanoto = await prisma.beasiswa.findMany({
    where: { provider: { contains: "Tanoto", mode: "insensitive" } },
    select: { id: true, nama: true, provider: true, urlResmi: true, sourceType: true, sourceUrl: true, createdAt: true },
  });

  for (const t of tanoto) {
    console.log("---");
    console.log("nama:", t.nama);
    console.log("provider:", t.provider);
    console.log("urlResmi:", t.urlResmi);
    console.log("sourceType:", t.sourceType);
    console.log("sourceUrl:", t.sourceUrl);
    console.log("createdAt:", t.createdAt);
  }
}

main().catch(console.error).finally(async () => { await prisma.$disconnect(); });
