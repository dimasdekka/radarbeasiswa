import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * For beasiswa where scraping failed (DNS issues, blocked sites, etc.),
 * use Wikipedia Commons URLs which are 100% reliable and never go down.
 * These are mostly logos/emblems of the issuing institutions.
 */
const FALLBACKS: { match: RegExp; imageUrl: string }[] = [
  // Indonesia government scholarships (Kemendikbud)
  { match: /beasiswa unggulan|BPI|pendidikan indonesia|KIP kuliah|KNB/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg/640px-Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg.png" },

  // LPDP - use Indonesian Ministry of Finance logo (parent agency)
  { match: /LPDP/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Logo_of_Indonesia_Endowment_Fund_for_Education.svg/640px-Logo_of_Indonesia_Endowment_Fund_for_Education.svg.png" },

  // Sampoerna
  { match: /sampoerna/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Sampoerna_Logo.svg/640px-Sampoerna_Logo.svg.png" },

  // Tanoto Foundation
  { match: /tanoto/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Tanoto_Foundation_Logo.svg/640px-Tanoto_Foundation_Logo.svg.png" },

  // Astra International
  { match: /astra/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Astra_International_Logo.svg/640px-Astra_International_Logo.svg.png" },

  // China Government / CSC - China emblem
  { match: /chinese government|CSC/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Emblem_of_the_People%27s_Republic_of_China.svg/640px-Emblem_of_the_People%27s_Republic_of_China.svg.png" },

  // Korean Government / KGSP / GKS
  { match: /korean government|KGSP|GKS/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/640px-Flag_of_South_Korea.svg.png" },

  // NUS
  { match: /\bNUS\b/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/NUS_coat_of_arms.svg/640px-NUS_coat_of_arms.svg.png" },

  // SINGA
  { match: /SINGA|singapore international/i,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Singapore.svg/640px-Flag_of_Singapore.svg.png" },
];

/**
 * Updates only beasiswa whose imageUrl is currently a mShots URL (placeholder).
 */
async function main() {
  const all = await prisma.beasiswa.findMany({
    where: {
      OR: [
        { imageUrl: { contains: "wordpress.com/mshots" } },
        { imageUrl: null },
      ],
    },
    select: { id: true, nama: true, imageUrl: true },
  });

  console.log(`Found ${all.length} beasiswa with placeholder/null images.\n`);

  let updated = 0;
  for (const b of all) {
    let matched: string | null = null;
    for (const f of FALLBACKS) {
      if (f.match.test(b.nama)) {
        matched = f.imageUrl;
        break;
      }
    }
    if (matched) {
      await prisma.beasiswa.update({ where: { id: b.id }, data: { imageUrl: matched } });
      console.log(`✓ ${b.nama.slice(0, 50).padEnd(50)} → fixed`);
      updated++;
    } else {
      console.log(`! ${b.nama.slice(0, 50).padEnd(50)} → no fallback`);
    }
  }

  console.log(`\nDone: ${updated} fixed.`);
}

main().finally(() => prisma.$disconnect());
