import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeScholarship } from "@/lib/normalizer";
import { generateEmbedding, beasiswaToText } from "@/lib/embedding";
import type { NormalizedScholarship } from "@/lib/normalizer";

export const maxDuration = 60;

/**
 * POST /api/admin/scraping/manual
 * Body: { sourceUrl, sourceName?, rawTitle?, rawContent, autoApprove? }
 *
 * For sites that block scrapers (LPDP, Kemdikbud Cloudflare-protected).
 * Admin opens the page in their browser, copies the content, pastes here.
 * Gemini still normalizes to structured JSON.
 *
 * This is the most reliable way to get blocked-site data into the system.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { sourceUrl, sourceName, rawTitle, rawContent, autoApprove } = body as {
    sourceUrl?: string;
    sourceName?: string;
    rawTitle?: string;
    rawContent?: string;
    autoApprove?: boolean;
  };

  if (!sourceUrl || !rawContent) {
    return NextResponse.json({ error: "sourceUrl dan rawContent wajib diisi" }, { status: 400 });
  }
  if (rawContent.trim().length < 100) {
    return NextResponse.json({ error: "rawContent terlalu pendek (minimal 100 karakter). Salin lebih banyak konten." }, { status: 400 });
  }

  // Validate URL
  try { new URL(sourceUrl); }
  catch { return NextResponse.json({ error: "URL tidak valid" }, { status: 400 }); }

  let resolvedSourceName = sourceName;
  if (!resolvedSourceName) {
    try { resolvedSourceName = new URL(sourceUrl).hostname; }
    catch { resolvedSourceName = "manual-paste"; }
  }

  // Run Gemini normalizer on the pasted content
  let normalized: NormalizedScholarship;
  try {
    normalized = await normalizeScholarship(
      rawTitle ?? resolvedSourceName,
      rawContent.slice(0, 16000), // give Gemini up to 16K chars
      sourceUrl
    );
  } catch (e) {
    return NextResponse.json({ error: `Gemini normalize gagal: ${(e as Error).message}` }, { status: 500 });
  }

  if (!normalized.nama || !normalized.provider) {
    const scraped = await prisma.scrapedScholarship.create({
      data: {
        sourceName: resolvedSourceName,
        sourceUrl,
        rawTitle: rawTitle ?? null,
        rawContent: rawContent.slice(0, 20000),
        normalizedData: normalized as object,
        status: "REJECTED",
        errorMessage: "Gemini tidak bisa ekstrak nama/provider — konten mungkin bukan halaman beasiswa atau terlalu sedikit info",
        reviewedAt: new Date(),
        reviewedBy: "system:no-data",
      },
    });
    return NextResponse.json({
      success: false,
      scraped,
      message: "Gemini tidak bisa ekstrak data beasiswa dari konten ini. Coba paste lebih lengkap.",
    }, { status: 200 });
  }

  // Duplicate check
  const existing = await prisma.beasiswa.findFirst({
    where: {
      nama: { equals: normalized.nama, mode: "insensitive" },
      provider: { equals: normalized.provider, mode: "insensitive" },
      aktif: true,
    },
    select: { id: true, nama: true },
  });

  if (existing) {
    const scraped = await prisma.scrapedScholarship.create({
      data: {
        sourceName: resolvedSourceName,
        sourceUrl,
        rawTitle: rawTitle ?? null,
        rawContent: rawContent.slice(0, 20000),
        normalizedData: normalized as object,
        status: "REJECTED",
        duplicateOfId: existing.id,
        errorMessage: `Duplicate of "${existing.nama}"`,
        reviewedAt: new Date(),
        reviewedBy: "system:duplicate-check",
      },
    });
    return NextResponse.json({
      success: false,
      scraped,
      duplicate: true,
      message: `Duplicate dari beasiswa "${existing.nama}" yang sudah ada di database.`,
    }, { status: 200 });
  }

  const shouldAutoPublish = autoApprove && normalized.confidence === "high";

  const scraped = await prisma.scrapedScholarship.create({
    data: {
      sourceName: resolvedSourceName,
      sourceUrl,
      rawTitle: rawTitle ?? null,
      rawContent: rawContent.slice(0, 20000),
      normalizedData: normalized as object,
      status: shouldAutoPublish ? "APPROVED" : "PENDING_REVIEW",
      reviewedAt: shouldAutoPublish ? new Date() : null,
      reviewedBy: shouldAutoPublish ? admin.email : null,
    },
  });

  let beasiswaId: string | undefined;
  if (shouldAutoPublish) {
    const beasiswa = await prisma.beasiswa.create({
      data: {
        nama: normalized.nama,
        provider: normalized.provider,
        negara: normalized.negara,
        jenjang: normalized.jenjang ?? [],
        targetUser: normalized.targetUser ?? [],
        deadline: normalized.deadline ? new Date(normalized.deadline) : null,
        deadlineNote: normalized.deadlineNote ?? null,
        cakupan: normalized.cakupan ?? [],
        ipkMinimum: normalized.ipkMinimum ?? null,
        nilaiMinimum: normalized.nilaiMinimum ?? null,
        toeflMinimum: normalized.toeflMinimum ?? null,
        ieltsMinimum: normalized.ieltsMinimum ?? null,
        pengalamanMin: normalized.pengalamanMin ?? null,
        bidangStudi: normalized.bidangStudi ?? [],
        bahasa: normalized.bahasa ?? [],
        persyaratan: (normalized.persyaratan ?? {}) as object,
        checklistDok: normalized.checklistDok ?? [],
        urlResmi: normalized.urlResmi || sourceUrl,
        sourceType: "SCRAPED",
        sourceUrl,
        verified: true,
        verifiedAt: new Date(),
        lastScrapedAt: new Date(),
      },
    });
    beasiswaId = beasiswa.id;

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
      console.error("Manual-paste embedding failed:", e);
    }
  }

  return NextResponse.json({
    success: true,
    scraped,
    beasiswaId,
    confidence: normalized.confidence,
    autoApproved: !!shouldAutoPublish,
    message: shouldAutoPublish
      ? `Beasiswa "${normalized.nama}" langsung di-publish (confidence: ${normalized.confidence}).`
      : `Beasiswa "${normalized.nama}" berhasil di-extract — masuk PENDING_REVIEW (confidence: ${normalized.confidence}).`,
  });
}
