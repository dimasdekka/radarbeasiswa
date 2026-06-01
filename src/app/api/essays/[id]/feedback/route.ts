import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateEssayFeedback } from "@/lib/essay-ai";

export const maxDuration = 60;

/**
 * POST /api/essays/[id]/feedback
 * Generates per-paragraph feedback and saves to essay.feedback.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const essay = await prisma.essay.findUnique({
    where: { id },
    include: { application: { include: { beasiswa: true } } },
  });

  if (!essay || essay.application.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!essay.konten || essay.konten.trim().length < 50) {
    return NextResponse.json({ error: "Essay terlalu pendek untuk di-review" }, { status: 400 });
  }

  try {
    const feedback = await generateEssayFeedback(
      essay.application.beasiswa,
      essay.judul,
      essay.konten
    );

    const updated = await prisma.essay.update({
      where: { id },
      data: { feedback: feedback as object },
    });

    return NextResponse.json({ essay: updated, feedback });
  } catch (e) {
    console.error("Generate feedback failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
