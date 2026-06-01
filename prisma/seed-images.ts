import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Maps beasiswa names/providers to relevant image URLs.
 * Using official logos and banners from public sources.
 */
const IMAGE_MAP: [RegExp, string][] = [
  // Indonesia - Government
  [/lpdp/i, "https://lpdp.kemenkeu.go.id/img/logo-lpdp.png"],
  [/kip kuliah/i, "https://kfrfrqnxqpeoomqftbkr.supabase.co/storage/v1/object/public/beasiswa-images/kip-kuliah.png"],
  [/beasiswa unggulan/i, "https://beasiswaunggulan.kemdikbud.go.id/assets/img/logo-bu.png"],
  [/bpi|pendidikan indonesia/i, "https://beasiswaunggulan.kemdikbud.go.id/assets/img/logo-bu.png"],

  // Indonesia - Foundation
  [/djarum/i, "https://djarumbeasiswaplus.org/assets/images/logo-dbp.png"],
  [/tanoto/i, "https://www.tanotofoundation.org/wp-content/uploads/2020/01/tanoto-foundation-logo.png"],
  [/sampoerna/i, "https://www.sampoernauniversity.ac.id/wp-content/uploads/2020/01/sampoerna-foundation-logo.png"],
  [/bank indonesia/i, "https://www.bi.go.id/id/tentang-bi/Documents/Logo-BI.png"],
  [/sobat bumi|pertamina/i, "https://pertaminafoundation.org/wp-content/uploads/2021/01/logo-pertamina-foundation.png"],

  // International
  [/chevening/i, "https://www.chevening.org/wp-content/themes/developer/images/chevening-logo.svg"],
  [/daad/i, "https://www.daad.de/logo.svg"],
  [/fulbright/i, "https://foreign.fulbrightonline.org/images/fulbright-logo.png"],
  [/australia awards/i, "https://www.australiaawardsindonesia.org/themes/aai/images/logo-aai.png"],
  [/mext/i, "https://www.studyinjapan.go.jp/en/_mt/2021/03/mext_logo.png"],
  [/erasmus/i, "https://erasmus-plus.ec.europa.eu/sites/default/files/2021-09/erasmus-plus-logo.png"],
  [/kaist/i, "https://www.kaist.ac.kr/resource/kaist-identity/symbol/kaist_emblem_color.png"],
  [/stipendium hungaricum/i, "https://stipendiumhungaricum.hu/uploads/2020/01/sh-logo.png"],
  [/ntu.*singapore|ntu.*asean/i, "https://www.ntu.edu.sg/images/default-source/corporate/ntu-logo.png"],
  [/nus/i, "https://www.nus.edu.sg/images/default-source/identity/nus-logo.png"],
  [/vlir/i, "https://www.vliruos.be/media/1004/vlir-uos-logo.png"],
  [/knb/i, "https://beasiswaunggulan.kemdikbud.go.id/assets/img/logo-bu.png"],
];

async function main() {
  const all = await prisma.beasiswa.findMany({ select: { id: true, nama: true, provider: true } });
  let updated = 0;

  for (const b of all) {
    const search = `${b.nama} ${b.provider}`;
    let imageUrl: string | null = null;

    for (const [regex, url] of IMAGE_MAP) {
      if (regex.test(search)) {
        imageUrl = url;
        break;
      }
    }

    if (imageUrl) {
      await prisma.beasiswa.update({
        where: { id: b.id },
        data: { imageUrl },
      });
      updated++;
      console.log(`✓ ${b.nama} → ${imageUrl.slice(0, 60)}...`);
    } else {
      console.log(`✗ ${b.nama} — no image match`);
    }
  }

  console.log(`\nDone: ${updated}/${all.length} beasiswa updated with images.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
