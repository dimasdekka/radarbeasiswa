import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkEligibility } from "@/lib/matching";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  // Total active beasiswa
  const totalBeasiswa = await prisma.beasiswa.count({ where: { aktif: true } });

  // Distribution data for dashboard charts
  const allActive = await prisma.beasiswa.findMany({
    where: { aktif: true },
    select: { negara: true, jenjang: true, cakupan: true, deadline: true },
  });

  // By country (top 6)
  const countryCount = new Map<string, number>();
  for (const b of allActive) {
    const key = b.negara || "Lainnya";
    countryCount.set(key, (countryCount.get(key) ?? 0) + 1);
  }
  const byCountry = Array.from(countryCount.entries())
    .map(([negara, count]) => ({ negara, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // By jenjang
  const jenjangCount: Record<string, number> = { S1: 0, S2: 0, S3: 0 };
  for (const b of allActive) {
    for (const j of b.jenjang) {
      if (j in jenjangCount) jenjangCount[j]++;
    }
  }
  const byJenjang = Object.entries(jenjangCount).map(([jenjang, count]) => ({ jenjang, count }));

  // Funding coverage: full vs partial
  let fullFunded = 0;
  for (const b of allActive) {
    if (b.cakupan.some((c) => /penuh|full/i.test(c))) fullFunded++;
  }
  const funding = [
    { name: "Full Funded", value: fullFunded },
    { name: "Parsial / Lainnya", value: Math.max(0, totalBeasiswa - fullFunded) },
  ];

  // Newly scraped & verified in last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const newScraped = await prisma.beasiswa.findMany({
    where: {
      aktif: true,
      sourceType: "SCRAPED",
      verified: true,
      verifiedAt: { gte: fourteenDaysAgo },
    },
    orderBy: { verifiedAt: "desc" },
    take: 5,
  });

  // Upcoming deadlines (next 60 days)
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);
  const upcomingDeadlines = await prisma.beasiswa.findMany({
    where: {
      aktif: true,
      deadline: { gte: new Date(), lte: in60Days },
    },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  // Applications in progress
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: {
      beasiswa: { select: { nama: true, provider: true, deadline: true, deadlineNote: true, checklistDok: true } },
      essays: { select: { id: true, judul: true, konten: true, updatedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Top matches if profile exists
  let topMatches: Array<{ id: string; nama: string; provider: string; negara: string; matchScore: number }> = [];
  let matchCount = 0;
  if (profile) {
    // Fetch all aktif beasiswa, score, take top
    const all = await prisma.beasiswa.findMany({ where: { aktif: true } });
    const sims = await prisma.$queryRawUnsafe<{ id: string; similarity: number }[]>(
      `SELECT b.id, 1 - (b.embedding <=> p.embedding) AS similarity
       FROM "Beasiswa" b, "Profile" p
       WHERE p."userId" = $1 AND p.embedding IS NOT NULL AND b.embedding IS NOT NULL`,
      user.id
    );
    const simMap = new Map(sims.map((r) => [r.id, Number(r.similarity)]));
    const scored = all.map((b) => {
      const sim = simMap.get(b.id) ?? null;
      const elig = checkEligibility(profile, b, sim);
      return { b, score: elig.score };
    });
    scored.sort((a, b) => b.score - a.score);
    matchCount = scored.filter((s) => s.score >= 60).length;
    topMatches = scored.slice(0, 5).map((s) => ({
      id: s.b.id,
      nama: s.b.nama,
      provider: s.b.provider,
      negara: s.b.negara,
      matchScore: s.score,
    }));
  }

  // Smart reminders per PRD 4.10
  const reminders = applications
    .map((app) => {
      const checklist = (app.checklist as Record<string, { ready: boolean }>) ?? {};
      const totalDocs = Object.keys(checklist).length;
      const readyDocs = Object.values(checklist).filter((c) => c.ready).length;
      const missingDocs = Object.entries(checklist).filter(([, v]) => !v.ready).map(([k]) => k);
      const essay = app.essays[0];
      const essayWords = essay?.konten ? essay.konten.replace(/<[^>]*>/g, "").trim().split(/\s+/).length : 0;

      let daysLeft: number | null = null;
      if (app.beasiswa.deadline) {
        daysLeft = Math.ceil((new Date(app.beasiswa.deadline).getTime() - Date.now()) / 86400000);
      }

      // Only include reminders for active applications with upcoming deadlines or work to do
      if (daysLeft != null && (daysLeft > 60 || daysLeft < 0)) return null;

      // Decide a smart message
      let priority: "high" | "medium" | "low" = "low";
      let message = "";
      const recommendations: string[] = [];

      if (daysLeft != null && daysLeft <= 7) {
        priority = "high";
        message = `🔥 Deadline ${daysLeft} hari lagi!`;
      } else if (daysLeft != null && daysLeft <= 14) {
        priority = "high";
        message = `⏰ ${daysLeft} hari lagi sampai deadline`;
      } else if (daysLeft != null && daysLeft <= 30) {
        priority = "medium";
        message = `📅 ${daysLeft} hari sampai deadline`;
      } else {
        priority = "low";
        message = "Mulai siapkan dokumen";
      }

      if (essayWords < 200) {
        recommendations.push("Lanjutkan menulis essay (saat ini < 200 kata)");
      } else if (essayWords < 500) {
        recommendations.push("Essay sudah dimulai — minta feedback AI untuk improve");
      }
      if (missingDocs.length > 0) {
        if (missingDocs.some((d) => d.toLowerCase().includes("rekomend"))) {
          recommendations.push("Hubungi dosen pembimbing untuk surat rekomendasi sekarang (proses bisa makan beberapa hari)");
        } else {
          recommendations.push(`Lengkapi ${missingDocs.length} dokumen: ${missingDocs.slice(0, 2).join(", ")}${missingDocs.length > 2 ? "..." : ""}`);
        }
      }

      return {
        applicationId: app.id,
        beasiswaNama: app.beasiswa.nama,
        priority,
        message,
        daysLeft,
        readyDocs,
        totalDocs,
        essayWords,
        recommendations,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  return NextResponse.json({
    stats: {
      totalBeasiswa,
      matchCount,
      newScrapedCount: newScraped.length,
      applicationsCount: applications.length,
    },
    charts: { byCountry, byJenjang, funding },
    topMatches,
    upcomingDeadlines,
    newScraped,
    applications: applications.map((app) => ({
      id: app.id,
      status: app.status,
      matchScore: app.matchScore,
      updatedAt: app.updatedAt,
      beasiswa: {
        nama: app.beasiswa.nama,
        provider: app.beasiswa.provider,
        deadline: app.beasiswa.deadline,
        deadlineNote: app.beasiswa.deadlineNote,
      },
    })),
    reminders,
    hasProfile: !!profile,
  });
}
