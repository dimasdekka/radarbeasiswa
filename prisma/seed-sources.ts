import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Curated scraping sources for BeasiswaRadar.
 *
 * Rule of thumb:
 * - Avoid .go.id government sites — Cloudflare/anti-bot makes them unscrapable from datacenters
 * - Prefer foundation sites, scholarship aggregators, and English-language official portals
 * - active=false for sources that are unstable but kept for reference
 */
const sources = [
  // ============ FOUNDATION INDONESIA (most stable) ============
  {
    name: "Tanoto Foundation TELADAN",
    url: "https://www.tanotofoundation.org/teladan",
    type: "PROVIDER",
    schedule: "WEEKLY",
    active: true,
  },
  {
    name: "Djarum Beasiswa Plus",
    url: "https://djarumbeasiswaplus.org",
    type: "PROVIDER",
    schedule: "WEEKLY",
    active: true,
  },
  {
    name: "Beasiswa Sobat Bumi Pertamina",
    url: "https://pertaminafoundation.org/beasiswa-sobat-bumi/",
    type: "PROVIDER",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Beasiswa BCA Finance",
    url: "https://www.bcafinance.co.id/about/scholarship/program-beasiswa",
    type: "PROVIDER",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Astra 1st Scholarship",
    url: "https://www.astra1st.com/about",
    type: "PROVIDER",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Sampoerna Foundation",
    url: "https://www.sampoernafoundation.org/scholarships/",
    type: "PROVIDER",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Beasiswa Yayasan Khazanah",
    url: "https://www.yayasankhazanah.com.my/scholarship/",
    type: "PROVIDER",
    schedule: "MONTHLY",
    active: true,
  },

  // ============ INTERNASIONAL POPULER (stable) ============
  {
    name: "Chevening — UK Government",
    url: "https://www.chevening.org/scholarship/indonesia/",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "DAAD Indonesia — Germany",
    url: "https://www.daad.id/en/scholarships/",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Australia Awards Indonesia",
    url: "https://www.australiaawardsindonesia.org/program-overview/3/scholarships/en",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "AMINEF Fulbright USA",
    url: "https://www.aminef.or.id/scholarship-programs-for-indonesian-citizen/",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Stipendium Hungaricum",
    url: "https://stipendiumhungaricum.hu/about/",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Erasmus Mundus Joint Master",
    url: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters-scholarships",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Türkiye Bursları",
    url: "https://www.turkiyeburslari.gov.tr/en/page/scholarships",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "China Scholarship Council (CSC)",
    url: "https://www.campuschina.org/scholarships",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "Mitsui Bussan Scholarship",
    url: "https://www.mbkscholarship-id.com",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: true,
  },

  // ============ KAMPUS TERNAMA ============
  {
    name: "NTU Singapore — Undergraduate Scholarships",
    url: "https://www.ntu.edu.sg/admissions/undergraduate/scholarships",
    type: "CAMPUS",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "NUS Singapore — Scholarships",
    url: "https://www.nus.edu.sg/oam/scholarships",
    type: "CAMPUS",
    schedule: "MONTHLY",
    active: true,
  },
  {
    name: "KAIST International Scholarship",
    url: "https://admission.kaist.ac.kr/intl-undergraduate/",
    type: "CAMPUS",
    schedule: "MONTHLY",
    active: true,
  },

  // ============ AGGREGATOR (sumber sekunder) ============
  {
    name: "Beasiswa Indo (Aggregator)",
    url: "https://beasiswaindo.com/scholarships/",
    type: "PROVIDER",
    schedule: "WEEKLY",
    active: true,
  },

  // ============ GOVERNMENT .go.id (mostly bot-blocked — use Manual Paste) ============
  // These sites work in your browser but block scrapers via Cloudflare/WAF.
  // Strategy: keep registered as reference. Admin can use "Manual Paste" feature
  // to copy content from browser → paste into admin panel → Gemini normalize.
  {
    name: "LPDP — Reguler",
    url: "https://lpdp.kemenkeu.go.id/beasiswa/umum/beasiswa-reguler",
    type: "OFFICIAL",
    schedule: "WEEKLY",
    active: false, // disabled — use manual paste instead
  },
  {
    name: "LPDP — Afirmasi",
    url: "https://lpdp.kemenkeu.go.id/beasiswa/afirmasi",
    type: "OFFICIAL",
    schedule: "WEEKLY",
    active: false,
  },
  {
    name: "LPDP — Targeted",
    url: "https://lpdp.kemenkeu.go.id/beasiswa/targeted",
    type: "OFFICIAL",
    schedule: "WEEKLY",
    active: false,
  },
  {
    name: "Beasiswa Unggulan Kemendikbud",
    url: "https://beasiswaunggulan.kemdikbud.go.id",
    type: "OFFICIAL",
    schedule: "WEEKLY",
    active: false,
  },
  {
    name: "Beasiswa Pendidikan Indonesia (BPI)",
    url: "https://beasiswa.kemdikbud.go.id",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: false,
  },
  {
    name: "KIP Kuliah",
    url: "https://kip-kuliah.kemdikbud.go.id",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: false,
  },
  {
    name: "KNB — Kemitraan Negara Berkembang",
    url: "https://knb.kemdikbud.go.id",
    type: "OFFICIAL",
    schedule: "MONTHLY",
    active: false,
  },
];

async function main() {
  console.log(`🌱 Seeding ${sources.length} scraping sources (${sources.filter((s) => s.active).length} active)...`);

  await prisma.scrapingSource.deleteMany({});
  for (const s of sources) {
    await prisma.scrapingSource.create({ data: s });
    const tag = s.active ? "✓" : "·";
    console.log(`  ${tag} ${s.name}`);
  }

  console.log(`\n✅ Seeded ${sources.length} sources (${sources.filter((s) => s.active).length} active, ${sources.filter((s) => !s.active).length} disabled)`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
