import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { generateEmbedding, beasiswaToText } from "@/lib/embedding";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const beasiswa = await prisma.beasiswa.findUnique({ where: { id } });
  if (!beasiswa) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ beasiswa });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  const stringFields = ["nama", "provider", "negara", "deadlineNote", "urlResmi", "imageUrl", "sourceType", "sourceUrl"];
  const arrayFields = ["jenjang", "targetUser", "cakupan", "bidangStudi", "bahasa", "checklistDok"];
  const numberFields = ["ipkMinimum", "nilaiMinimum", "toeflMinimum", "ieltsMinimum", "pengalamanMin"];
  const boolFields = ["verified", "aktif"];

  for (const f of stringFields) {
    if (body[f] !== undefined) updateData[f] = body[f] || null;
  }
  for (const f of arrayFields) {
    if (Array.isArray(body[f])) updateData[f] = body[f];
  }
  for (const f of numberFields) {
    if (body[f] === null || body[f] === "") updateData[f] = null;
    else if (body[f] !== undefined) updateData[f] = parseFloat(body[f]);
  }
  for (const f of boolFields) {
    if (typeof body[f] === "boolean") updateData[f] = body[f];
  }
  if (body.deadline !== undefined) {
    updateData.deadline = body.deadline ? new Date(body.deadline) : null;
  }
  if (body.persyaratan !== undefined) updateData.persyaratan = body.persyaratan;
  if (body.rubrikEssay !== undefined) updateData.rubrikEssay = body.rubrikEssay;

  const beasiswa = await prisma.beasiswa.update({
    where: { id },
    data: updateData,
  });

  // Re-generate embedding
  try {
    const text = beasiswaToText(beasiswa);
    const vec = await generateEmbedding(text);
    const vecString = `[${vec.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "Beasiswa" SET embedding = $1::vector WHERE id = $2`,
      vecString,
      beasiswa.id
    );
  } catch (e) {
    console.error("Embedding regen failed:", e);
  }

  return NextResponse.json({ success: true, beasiswa });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Soft delete: mark as inactive
  await prisma.beasiswa.update({
    where: { id },
    data: { aktif: false },
  });

  return NextResponse.json({ success: true });
}
