import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateGuidedQuestions } from "@/lib/essay-ai";

export const maxDuration = 30;

/**
 * POST /api/essays/[id]/questions
 * Generates 4-6 guided questions for the essay's beasiswa rubric.
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

  try {
    const questions = await generateGuidedQuestions(essay.application.beasiswa, essay.judul);
    return NextResponse.json({ questions });
  } catch (e) {
    console.error("Generate questions failed:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
