import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkEligibility } from "@/lib/matching";

/**
 * POST /api/applications
 * Body: { beasiswaId }
 * Creates an Application workspace + initial checklist from beasiswa.checklistDok.
 * Idempotent: if application already exists for this user+beasiswa, returns it.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { beasiswaId } = await request.json();
  if (!beasiswaId) return NextResponse.json({ error: "beasiswaId required" }, { status: 400 });

  // Check existing
  const existing = await prisma.application.findUnique({
    where: { userId_beasiswaId: { userId: user.id, beasiswaId } },
  });
  if (existing) return NextResponse.json({ application: existing, existed: true });

  const [profile, beasiswa] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.beasiswa.findUnique({ where: { id: beasiswaId } }),
  ]);
  if (!beasiswa) return NextResponse.json({ error: "Beasiswa not found" }, { status: 404 });

  // Compute initial match score for this application
  let matchScore = 0;
  if (profile) {
    matchScore = checkEligibility(profile, beasiswa).score;
  }

  // Build initial checklist from beasiswa.checklistDok
  const initialChecklist: Record<string, { ready: boolean; updatedAt: string }> = {};
  for (const doc of beasiswa.checklistDok) {
    initialChecklist[doc] = { ready: false, updatedAt: new Date().toISOString() };
  }

  const application = await prisma.application.create({
    data: {
      userId: user.id,
      beasiswaId,
      matchScore,
      status: "RISET",
      checklist: initialChecklist,
    },
  });

  return NextResponse.json({ application, existed: false });
}

/**
 * GET /api/applications
 * Returns user's applications with beasiswa joined.
 */
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { beasiswa: true, essays: { select: { id: true, judul: true, versi: true, updatedAt: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ applications });
}
