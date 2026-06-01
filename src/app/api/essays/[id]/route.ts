import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

async function authorizeEssay(essayId: string, userId: string) {
  const essay = await prisma.essay.findUnique({
    where: { id: essayId },
    include: { application: true },
  });
  if (!essay || essay.application.userId !== userId) return null;
  return essay;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const essay = await authorizeEssay(id, user.id);
  if (!essay) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ essay });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const essay = await authorizeEssay(id, user.id);
  if (!essay) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  const updated = await prisma.essay.update({
    where: { id },
    data: {
      judul: body.judul ?? undefined,
      konten: body.konten ?? undefined,
      versi: body.konten !== undefined ? { increment: 1 } : undefined,
    },
  });

  return NextResponse.json({ essay: updated });
}
