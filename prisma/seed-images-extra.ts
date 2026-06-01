import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const updates: [string, string][] = [
    ["BCA Finance", "https://www.bcafinance.co.id/images/logo-bca-finance.png"],
    ["Türkiye", "https://www.turkiyeburslari.gov.tr/images/tb-logo.png"],
    ["CSC", "https://www.campuschina.org/images/logo.png"],
    ["KGSP", "https://www.studyinkorea.go.kr/images/common/logo.png"],
    ["GKS", "https://www.studyinkorea.go.kr/images/common/logo.png"],
    ["Mitsui", "https://www.mbkscholarship.com/images/logo.png"],
    ["Astra", "https://www.astra.co.id/images/logo-astra.png"],
  ];
  for (const [keyword, url] of updates) {
    const r = await prisma.beasiswa.updateMany({
      where: { nama: { contains: keyword, mode: "insensitive" }, imageUrl: null },
      data: { imageUrl: url },
    });
    if (r.count > 0) console.log(`✓ ${keyword} → ${r.count} updated`);
  }
  console.log("Done");
}
main().finally(() => prisma.$disconnect());
