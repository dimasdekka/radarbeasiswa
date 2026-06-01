import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkEligibility } from "@/lib/matching";
import { explainEligibility } from "@/lib/explainer";

/**
 * POST /api/beasiswa/[id]/explain
 * Returns AI eligibility explanation for the current user.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, beasiswa] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.beasiswa.findUnique({ where: { id } }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Lengkapi profil dulu di /onboarding" }, { status: 400 });
  }
  if (!beasiswa) {
    return NextResponse.json({ error: "Beasiswa not found" }, { status: 404 });
  }

  // Compute semantic similarity
  let similarity: number | null = null;
  try {
    const rows = await prisma.$queryRawUnsafe<{ similarity: number }[]>(
      `SELECT 1 - (b.embedding <=> p.embedding) AS similarity
       FROM "Beasiswa" b, "Profile" p
       WHERE p."userId" = $1 AND b.id = $2
         AND p.embedding IS NOT NULL AND b.embedding IS NOT NULL`,
      user.id,
      id
    );
    if (rows[0]) similarity = Number(rows[0].similarity);
  } catch (e) {
    console.error("Similarity query failed:", e);
  }

  const eligibility = checkEligibility(profile, beasiswa, similarity);

  let explanation = "";
  try {
    explanation = await explainEligibility(profile, beasiswa, eligibility);
  } catch (e) {
    console.error("Explainer failed:", e);
    explanation = "Penjelasan AI tidak dapat dimuat saat ini. Silakan coba lagi.";
  }

  return NextResponse.json({ eligibility, explanation, similarity });
}
