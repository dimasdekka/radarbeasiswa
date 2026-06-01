import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateEssayDraft } from "@/lib/essay-ai";

export const maxDuration = 60;

/**
 * POST /api/essays/[id]/generate
 * Body: { answers: [{ question, answer }, ...] }
 * Generates a draft essay from guided answers, saves to konten.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { answers } = await request.json();

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "answers array required" }, { status: 400 });
  }

  const essay = await prisma.essay.findUnique({
    where: { id },
    include: { application: { include: { beasiswa: true } } },
  });

  if (!essay || essay.application.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Profil belum lengkap" }, { status: 400 });
  }

  try {
    const draft = await generateEssayDraft(
      essay.application.beasiswa,
      profile,
      essay.judul,
      answers
    );

    const updated = await prisma.essay.update({
      where: { id },
      data: { konten: draft, versi: { increment: 1 } },
    });

    return NextResponse.json({ essay: updated, draft });
  } catch (e) {
    console.error("Generate draft failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
