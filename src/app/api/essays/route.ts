import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/essays
 * Body: { applicationId, judul }
 * Creates a new (empty) essay tied to an application.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId, judul } = await request.json();
  if (!applicationId || !judul) {
    return NextResponse.json({ error: "applicationId and judul required" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application || application.userId !== user.id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const essay = await prisma.essay.create({
    data: { applicationId, judul, konten: "" },
  });

  return NextResponse.json({ essay });
}
