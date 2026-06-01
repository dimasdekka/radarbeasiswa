import type { Beasiswa, Profile } from "@prisma/client";

export interface EligibilityResult {
  /** 0–100 score */
  score: number;
  /** Notes that explain warnings, e.g. "TOEFL belum tersedia" */
  warnings: string[];
  /** Hard mismatches that should disqualify or strongly down-rank */
  blockers: string[];
  /** Positive matches */
  matches: string[];
}

/**
 * Rule-based eligibility check per PRD section 4.4 weight table.
 *
 * Komponen match score:
 * - Jenjang cocok                : 20%
 * - Target user cocok            : 15%
 * - Negara/lokasi cocok          : 15%
 * - IPK / nilai memenuhi         : 15%
 * - Skor bahasa memenuhi         : 10%
 * - Bidang studi relevan         : 10%
 * - Kebutuhan finansial cocok    : 5%
 * - Semantic similarity (vector) : 10%
 *
 * @param semanticSimilarity Cosine similarity score in 0..1, or null if unavailable.
 */
export function checkEligibility(
  profile: Profile,
  beasiswa: Beasiswa,
  semanticSimilarity: number | null = null
): EligibilityResult {
  const warnings: string[] = [];
  const blockers: string[] = [];
  const matches: string[] = [];
  let score = 0;

  // 1. Jenjang cocok (20%)
  if (profile.targetJenjang) {
    if (beasiswa.jenjang.includes(profile.targetJenjang)) {
      score += 20;
      matches.push(`Jenjang cocok: ${profile.targetJenjang}`);
    } else {
      blockers.push(`Jenjang tidak cocok (hanya ${beasiswa.jenjang.join("/")})`);
    }
  }

  // 2. Target user cocok (15%)
  if (beasiswa.targetUser.includes(profile.tipe)) {
    score += 15;
    matches.push(`Sesuai untuk ${profile.tipe}`);
  } else {
    blockers.push(`Untuk ${beasiswa.targetUser.join("/")}, profil kamu ${profile.tipe}`);
  }

  // 3. Negara cocok (15%)
  if (profile.targetNegara.length > 0) {
    if (profile.targetNegara.some((n) => beasiswa.negara.toLowerCase().includes(n.toLowerCase()))) {
      score += 15;
      matches.push(`Target negara cocok: ${beasiswa.negara}`);
    } else {
      warnings.push(`Negara ${beasiswa.negara} di luar target kamu`);
    }
  } else {
    // No preference - give partial credit
    score += 8;
  }

  // 4. IPK / nilai memenuhi (15%)
  if (profile.tipe === "MAHASISWA" && beasiswa.ipkMinimum) {
    if (profile.ipk == null) {
      warnings.push(`Beasiswa ini butuh IPK minimal ${beasiswa.ipkMinimum} — IPK kamu belum diisi`);
      score += 5;
    } else if (profile.ipk >= beasiswa.ipkMinimum) {
      score += 15;
      matches.push(`IPK memenuhi: ${profile.ipk} ≥ ${beasiswa.ipkMinimum}`);
    } else {
      warnings.push(`IPK kamu ${profile.ipk} di bawah syarat ${beasiswa.ipkMinimum}`);
    }
  } else if (profile.tipe === "SMA" && beasiswa.nilaiMinimum) {
    if (profile.nilaiRataRata == null) {
      warnings.push(`Beasiswa ini butuh nilai minimal ${beasiswa.nilaiMinimum} — nilai kamu belum diisi`);
      score += 5;
    } else if (profile.nilaiRataRata >= beasiswa.nilaiMinimum) {
      score += 15;
      matches.push(`Nilai memenuhi: ${profile.nilaiRataRata} ≥ ${beasiswa.nilaiMinimum}`);
    } else {
      warnings.push(`Nilai kamu ${profile.nilaiRataRata} di bawah syarat ${beasiswa.nilaiMinimum}`);
    }
  } else {
    // No requirement → full credit
    score += 15;
  }

  // 5. Skor bahasa memenuhi (10%)
  const needsLang = beasiswa.toeflMinimum != null || beasiswa.ieltsMinimum != null;
  if (needsLang) {
    const toeflOk = beasiswa.toeflMinimum != null && profile.toefl != null && profile.toefl >= beasiswa.toeflMinimum;
    const ieltsOk = beasiswa.ieltsMinimum != null && profile.ielts != null && profile.ielts >= beasiswa.ieltsMinimum;

    if (toeflOk || ieltsOk) {
      score += 10;
      matches.push(`Skor bahasa memenuhi`);
    } else if (profile.toefl == null && profile.ielts == null) {
      warnings.push(
        `Perlu skor bahasa: TOEFL ≥ ${beasiswa.toeflMinimum ?? "—"} atau IELTS ≥ ${beasiswa.ieltsMinimum ?? "—"}`
      );
      score += 3;
    } else {
      warnings.push(`Skor bahasa kamu di bawah syarat`);
    }
  } else {
    score += 10;
  }

  // 6. Bidang studi relevan (10%)
  if (profile.targetBidang.length > 0 && beasiswa.bidangStudi.length > 0) {
    const all = beasiswa.bidangStudi.join(" ").toLowerCase();
    const overlap = profile.targetBidang.some(
      (b) => all.includes(b.toLowerCase()) || all.includes("semua")
    );
    if (overlap) {
      score += 10;
      matches.push(`Bidang studi relevan`);
    } else {
      score += 3;
    }
  } else {
    score += 5;
  }

  // 7. Kebutuhan finansial cocok (5%)
  if (profile.butuhFinansial) {
    const isFullFunded = beasiswa.cakupan.some(
      (c) => c.toLowerCase().includes("penuh") || c.toLowerCase().includes("full")
    );
    if (isFullFunded) {
      score += 5;
      matches.push(`Beasiswa full-funded sesuai kebutuhan`);
    } else {
      warnings.push(`Cakupan tidak full-funded`);
    }
  } else {
    score += 5;
  }

  // 8. Semantic similarity (10%) — provided by pgvector cosine distance
  if (semanticSimilarity != null) {
    // Map 0..1 similarity → 0..10 score
    const semScore = Math.max(0, Math.min(10, semanticSimilarity * 10));
    score += semScore;
    if (semanticSimilarity >= 0.7) {
      matches.push(`Profil sangat relevan dengan beasiswa ini`);
    }
  } else {
    // Fallback partial credit if embedding missing
    score += 5;
  }

  // Cap to 100
  score = Math.min(100, Math.round(score));

  return { score, warnings, blockers, matches };
}
