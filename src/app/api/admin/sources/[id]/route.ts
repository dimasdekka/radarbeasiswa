import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  if (body.url) {
    try { new URL(body.url); }
    catch { return NextResponse.json({ error: "URL tidak valid" }, { status: 400 }); }
  }

  const source = await prisma.scrapingSource.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      url: body.url ?? undefined,
      type: body.type ?? undefined,
      schedule: body.schedule ?? undefined,
      active: body.active ?? undefined,
    },
  });

  return NextResponse.json({ source });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.scrapingSource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
