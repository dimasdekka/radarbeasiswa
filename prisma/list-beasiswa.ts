import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const all = await p.beasiswa.findMany({ select: { id: true, nama: true, negara: true, provider: true } });
  for (const b of all) console.log(`${b.nama} | ${b.negara} | ${b.provider}`);
  console.log(`\nTotal: ${all.length}`);
}
main().finally(() => p.$disconnect());
