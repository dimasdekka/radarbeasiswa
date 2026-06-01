import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkEligibility } from "@/lib/matching";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "newest"; // newest | deadline | match
  const view = searchParams.get("view") ?? "all"; // all | match | deadline | new | scraped
  const jenjang = searchParams.getAll("jenjang");
  const negara = searchParams.getAll("negara");
  const targetUser = searchParams.getAll("targetUser");
  const cakupan = searchParams.get("cakupan"); // full | partial | uang_saku
  const bahasa = searchParams.getAll("bahasa");
  const sourceType = searchParams.get("sourceType"); // MANUAL | SCRAPED
  const ipkMin = searchParams.get("ipkMin");
  const toeflMin = searchParams.get("toeflMin");

  const where: Prisma.BeasiswaWhereInput = { aktif: true };

  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { provider: { contains: search, mode: "insensitive" } },
      { negara: { contains: search, mode: "insensitive" } },
      { bidangStudi: { hasSome: [search] } },
    ];
  }

  if (jenjang.length > 0) where.jenjang = { hasSome: jenjang };
  if (negara.length > 0) where.negara = { in: negara };
  if (targetUser.length > 0) where.targetUser = { hasSome: targetUser };
  if (bahasa.length > 0) where.bahasa = { hasSome: bahasa };
  if (sourceType) where.sourceType = sourceType;

  if (cakupan === "full") {
    where.cakupan = { hasSome: ["Biaya kuliah penuh"] };
  }

  if (ipkMin) where.ipkMinimum = { lte: parseFloat(ipkMin) };
  if (toeflMin) where.toeflMinimum = { lte: parseInt(toeflMin) };

  // Deadline view
  if (view === "deadline") {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    where.deadline = { lte: in30Days, gte: new Date() };
  }

  // New view (last 14 days)
  if (view === "new") {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    where.createdAt = { gte: fourteenDaysAgo };
  }

  // Scraped & verified view
  if (view === "scraped") {
    where.sourceType = "SCRAPED";
    where.verified = true;
  }

  // Sorting (default newest; deadline & match handled separately)
  const orderBy: Prisma.BeasiswaOrderByWithRelationInput =
    sort === "deadline" ? { deadline: "asc" } : { createdAt: "desc" };

  const beasiswa = await prisma.beasiswa.findMany({ where, orderBy });

  // Get profile for matching scores if logged in
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  }

  // Fetch semantic similarities (cosine) from pgvector if profile has embedding
  let similarityMap = new Map<string, number>();
  if (profile && user) {
    try {
      const rows = await prisma.$queryRawUnsafe<{ id: string; similarity: number }[]>(
        `SELECT b.id, 1 - (b.embedding <=> p.embedding) AS similarity
         FROM "Beasiswa" b, "Profile" p
         WHERE p."userId" = $1
           AND p.embedding IS NOT NULL
           AND b.embedding IS NOT NULL`,
        user.id
      );
      similarityMap = new Map(rows.map((r) => [r.id, Number(r.similarity)]));
    } catch (e) {
      console.error("Cosine similarity query failed:", e);
    }
  }

  // Compute eligibility for each beasiswa if profile exists
  const enriched = beasiswa.map((b) => {
    if (!profile) return { ...b, matchScore: null, eligibility: null };
    const sim = similarityMap.get(b.id) ?? null;
    const eligibility = checkEligibility(profile, b, sim);
    return { ...b, matchScore: eligibility.score, eligibility, similarity: sim };
  });

  // Sort by match score if requested
  if (sort === "match" && profile) {
    enriched.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }

  // Apply "Cocok untuk Saya" filter (view=match)
  let result = enriched;
  if (view === "match" && profile) {
    result = enriched.filter((b) => (b.matchScore ?? 0) >= 50);
    result.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }

  return NextResponse.json({ beasiswa: result, total: result.length });
}
