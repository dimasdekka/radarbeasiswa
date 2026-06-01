import type { Beasiswa, Profile } from "@prisma/client";
import type { EligibilityResult } from "./matching";
import { generateText } from "@/lib/gemini";

/**
 * Generate an eligibility explanation in Bahasa Indonesia using Gemini.
 * Per PRD section 4.4 — the explainer turns the rule-based result into
 * actionable, friendly advice for the user.
 */
export async function explainEligibility(
  profile: Profile,
  beasiswa: Beasiswa,
  eligibility: EligibilityResult
): Promise<string> {
  const profileSummary =
    profile.tipe === "MAHASISWA"
      ? `Mahasiswa ${profile.jurusan ?? "—"} di ${profile.universitas ?? "—"}, IPK ${profile.ipk ?? "—"}, TOEFL ${profile.toefl ?? "—"}, IELTS ${profile.ielts ?? "—"}, target ${profile.targetJenjang} di ${profile.targetNegara.join(", ") || "—"}, bidang ${profile.targetBidang.join(", ") || "—"}`
      : `Siswa SMA kelas ${profile.kelas ?? "—"}, nilai rapor ${profile.nilaiRataRata ?? "—"}, target ${profile.targetJenjang} di ${profile.targetNegara.join(", ") || "—"}, bidang ${profile.targetBidang.join(", ") || "—"}`;

  const beasiswaSummary = `${beasiswa.nama} (${beasiswa.provider}, ${beasiswa.negara}). Jenjang ${beasiswa.jenjang.join("/")}, target ${beasiswa.targetUser.join("/")}. Min IPK ${beasiswa.ipkMinimum ?? "—"}, min nilai ${beasiswa.nilaiMinimum ?? "—"}, min TOEFL ${beasiswa.toeflMinimum ?? "—"}, min IELTS ${beasiswa.ieltsMinimum ?? "—"}.`;

  const prompt = `Kamu adalah konsultan beasiswa berpengalaman. Jelaskan dalam Bahasa Indonesia (maks 4 kalimat) kenapa profil pengguna ini cocok atau tidak cocok untuk beasiswa berikut, dan apa langkah konkret berikutnya yang harus dia lakukan.

PROFIL PENGGUNA:
${profileSummary}

BEASISWA:
${beasiswaSummary}

HASIL CEK SISTEM:
- Match score: ${eligibility.score}%
- Yang sudah cocok: ${eligibility.matches.join("; ") || "—"}
- Yang perlu diperhatikan: ${eligibility.warnings.join("; ") || "—"}
- Hambatan: ${eligibility.blockers.join("; ") || "—"}

Tulis dengan tone teman yang suportif. JANGAN ulangi list di atas, langsung ke insight dan saran action.`;

  const text = await generateText(prompt);
  return text.trim();
}
