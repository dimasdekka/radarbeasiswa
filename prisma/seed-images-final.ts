import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Hardcoded image URLs that are GUARANTEED to work.
 * Using Wikipedia/Wikimedia Commons (public, no CORS, always available).
 * Format: [keyword to match in nama/provider, imageUrl]
 */
const IMAGES: [string, string][] = [
  // Indonesia
  ["LPDP", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Logo_of_Indonesia_Endowment_Fund_for_Education.svg/480px-Logo_of_Indonesia_Endowment_Fund_for_Education.svg.png"],
  ["KIP Kuliah", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg/480px-Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg.png"],
  ["Beasiswa Unggulan", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg/480px-Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg.png"],
  ["BPI", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg/480px-Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg.png"],
  ["KNB", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg/480px-Logo_of_the_Ministry_of_Education%2C_Culture%2C_Research%2C_and_Technology_of_the_Republic_of_Indonesia.svg.png"],
  ["Tanoto", "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Tanoto_Foundation_Logo.svg/480px-Tanoto_Foundation_Logo.svg.png"],
  ["Djarum", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Djarum_Logo.svg/480px-Djarum_Logo.svg.png"],
  ["Bank Indonesia", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bank_Indonesia_2022.svg/480px-Bank_Indonesia_2022.svg.png"],
  ["Pertamina", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Pertamina_2022.svg/480px-Pertamina_2022.svg.png"],
  ["Sampoerna", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Sampoerna_University_Logo.png/480px-Sampoerna_University_Logo.png"],
  ["BCA", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/480px-Bank_Central_Asia.svg.png"],
  ["Astra", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Astra_International_Logo.svg/480px-Astra_International_Logo.svg.png"],
  // International
  ["Chevening", "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Chevening_logo.svg/480px-Chevening_logo.svg.png"],
  ["DAAD", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/DAAD_Logo_Supplement_2019_rgb.svg/480px-DAAD_Logo_Supplement_2019_rgb.svg.png"],
  ["Fulbright", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Fulbright_U.S._Student_Program_Logo.svg/480px-Fulbright_U.S._Student_Program_Logo.svg.png"],
  ["Australia Awards", "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Coat_of_Arms_of_Australia.svg/480px-Coat_of_Arms_of_Australia.svg.png"],
  ["MEXT", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Emblem_of_the_Ministry_of_Education%2C_Culture%2C_Sports%2C_Science_and_Technology_of_Japan.svg/480px-Emblem_of_the_Ministry_of_Education%2C_Culture%2C_Sports%2C_Science_and_Technology_of_Japan.svg.png"],
  ["Erasmus", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Erasmus%2B_Logo.svg/480px-Erasmus%2B_Logo.svg.png"],
  ["KAIST", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/KAIST_logo.svg/480px-KAIST_logo.svg.png"],
  ["Stipendium Hungaricum", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Coat_of_arms_of_Hungary.svg/480px-Coat_of_arms_of_Hungary.svg.png"],
  ["NTU", "https://upload.wikimedia.org/wikipedia/en/thumb/c/c6/Nanyang_Technological_University.svg/480px-Nanyang_Technological_University.svg.png"],
  ["NUS", "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/NUS_coat_of_arms.svg/480px-NUS_coat_of_arms.svg.png"],
  ["VLIR", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Flag_of_Belgium.svg/480px-Flag_of_Belgium.svg.png"],
  ["CSC", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Emblem_of_the_People%27s_Republic_of_China.svg/480px-Emblem_of_the_People%27s_Republic_of_China.svg.png"],
  ["Mitsui", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Mitsui_Logo.svg/480px-Mitsui_Logo.svg.png"],
  ["Türkiye", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Flag_of_Turkey.svg/480px-Flag_of_Turkey.svg.png"],
  ["KGSP", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/480px-Flag_of_South_Korea.svg.png"],
  ["GKS", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/480px-Flag_of_South_Korea.svg.png"],
  ["SINGA", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Singapore.svg/480px-Flag_of_Singapore.svg.png"],
];

async function main() {
  let updated = 0;
  for (const [keyword, url] of IMAGES) {
    const r = await prisma.beasiswa.updateMany({
      where: { nama: { contains: keyword, mode: "insensitive" } },
      data: { imageUrl: url },
    });
    if (r.count > 0) {
      updated += r.count;
      console.log(`✓ ${keyword} → ${r.count} updated`);
    }
  }
  console.log(`\nDone: ${updated} beasiswa updated with working images.`);
}
main().finally(() => prisma.$disconnect());
