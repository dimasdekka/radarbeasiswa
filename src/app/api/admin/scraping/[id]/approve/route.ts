import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { generateEmbedding, beasiswaToText } from "@/lib/embedding";
import type { NormalizedScholarship } from "@/lib/normalizer";

/**
 * POST /api/admin/scraping/[id]/approve
 * Promotes a PENDING_REVIEW ScrapedScholarship to a Beasiswa record.
 * Per PRD section 4.12 — Admin Review Panel.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const scraped = await prisma.scrapedScholarship.findUnique({ where: { id } });
  if (!scraped) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = scraped.normalizedData as unknown as NormalizedScholarship | null;
  if (!data) return NextResponse.json({ error: "No normalized data to approve" }, { status: 400 });

  // Create the Beasiswa
  const beasiswa = await prisma.beasiswa.create({
    data: {
      nama: data.nama || scraped.rawTitle || "Beasiswa Tanpa Nama",
      provider: data.provider || scraped.sourceName,
      negara: data.negara || "—",
      jenjang: data.jenjang ?? [],
      targetUser: data.targetUser ?? [],
      deadline: data.deadline ? new Date(data.deadline) : null,
      deadlineNote: data.deadlineNote ?? null,
      cakupan: data.cakupan ?? [],
      ipkMinimum: data.ipkMinimum ?? null,
      nilaiMinimum: data.nilaiMinimum ?? null,
      toeflMinimum: data.toeflMinimum ?? null,
      ieltsMinimum: data.ieltsMinimum ?? null,
      pengalamanMin: data.pengalamanMin ?? null,
      bidangStudi: data.bidangStudi ?? [],
      bahasa: data.bahasa ?? [],
      persyaratan: (data.persyaratan ?? {}) as object,
      checklistDok: data.checklistDok ?? [],
      urlResmi: data.urlResmi || scraped.sourceUrl,
      imageUrl: data.imageUrl ?? null,
      sourceType: "SCRAPED",
      sourceUrl: scraped.sourceUrl,
      verified: true,
      verifiedAt: new Date(),
      lastScrapedAt: scraped.scrapedAt,
    },
  });

  // Mark scraped as APPROVED
  await prisma.scrapedScholarship.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedBy: admin.email,
    },
  });

  // Generate embedding for the new beasiswa (best-effort)
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
    console.error("Embedding for approved beasiswa failed:", e);
  }

  return NextResponse.json({ success: true, beasiswa });
}
