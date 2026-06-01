import { prisma } from "@/lib/prisma";
import { scrapePage } from "@/lib/scraper";
import { normalizeScholarship, type NormalizedScholarship } from "@/lib/normalizer";
import { generateEmbedding, beasiswaToText } from "@/lib/embedding";
import { GeminiRateLimitError } from "@/lib/gemini";

export interface PipelineResult {
  sourceName: string;
  sourceUrl: string;
  status: "scraped" | "auto-approved" | "duplicate" | "failed" | "rate-limited";
  scrapedId?: string;
  beasiswaId?: string;
  error?: string;
}

/**
 * Run the full pipeline for one URL: scrape → normalize → save as ScrapedScholarship.
 * If autoApprove=true and Gemini reports confidence:"high", also publish directly to Beasiswa.
 * Per PRD section 4.5 — admin still controls final publish for medium/low confidence.
 */
export async function runScrapingPipeline(opts: {
  sourceName: string;
  sourceUrl: string;
  sourceId?: string;
  autoApprove?: boolean;
  reviewedBy?: string;
}): Promise<PipelineResult> {
  const { sourceName, sourceUrl, sourceId, autoApprove, reviewedBy } = opts;

  try {
    // 1. Scrape
    const raw = await scrapePage(sourceUrl);

    // 2. Normalize via Gemini
    const normalized: NormalizedScholarship = await normalizeScholarship(raw.title, raw.content, sourceUrl, raw.images);

    // Validate critical fields — skip if Gemini couldn't extract name/provider
    if (!normalized.nama || !normalized.provider) {
      const scraped = await prisma.scrapedScholarship.create({
        data: {
          sourceName,
          sourceUrl,
          rawTitle: raw.title,
          rawContent: raw.content,
          normalizedData: normalized as object,
          status: "REJECTED",
          errorMessage: "Gemini gagal mengekstrak nama/provider dari halaman ini (kemungkinan halaman bukan halaman beasiswa)",
          reviewedAt: new Date(),
          reviewedBy: "system:no-data",
        },
      });
      return {
        sourceName, sourceUrl,
        status: "failed",
        scrapedId: scraped.id,
        error: "Empty extraction",
      };
    }

    // 3. Duplicate check (by name + provider) — only when both fields are present
    const existing = await prisma.beasiswa.findFirst({
      where: {
        nama: { equals: normalized.nama, mode: "insensitive" },
        provider: { equals: normalized.provider, mode: "insensitive" },
        aktif: true,
      },
      select: { id: true },
    });

    if (existing) {
      // Save as duplicate-rejected so admin can see history
      const scraped = await prisma.scrapedScholarship.create({
        data: {
          sourceName,
          sourceUrl,
          rawTitle: raw.title,
          rawContent: raw.content,
          normalizedData: normalized as object,
          status: "REJECTED",
          duplicateOfId: existing.id,
          errorMessage: "Duplicate of existing beasiswa",
          reviewedAt: new Date(),
          reviewedBy: "system:duplicate-check",
        },
      });
      return {
        sourceName, sourceUrl,
        status: "duplicate",
        scrapedId: scraped.id,
        beasiswaId: existing.id,
      };
    }

    const shouldAutoPublish = autoApprove && normalized.confidence === "high";

    // 4. Save scraped record
    const scraped = await prisma.scrapedScholarship.create({
      data: {
        sourceName,
        sourceUrl,
        rawTitle: raw.title,
        rawContent: raw.content,
        normalizedData: normalized as object,
        status: shouldAutoPublish ? "APPROVED" : "PENDING_REVIEW",
        reviewedAt: shouldAutoPublish ? new Date() : null,
        reviewedBy: shouldAutoPublish ? (reviewedBy ?? "system:auto-approve") : null,
      },
    });

    if (sourceId) {
      await prisma.scrapingSource.update({
        where: { id: sourceId },
        data: { lastRunAt: new Date(), lastStatus: shouldAutoPublish ? "AUTO_APPROVED" : "PENDING_REVIEW" },
      });
    }

    // 5. If high confidence + autoApprove enabled → also create Beasiswa
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
          imageUrl: raw.ogImage ?? normalized.imageUrl ?? null,
          sourceType: "SCRAPED",
          sourceUrl,
          verified: true,
          verifiedAt: new Date(),
          lastScrapedAt: new Date(),
        },
      });

      // Generate embedding (best-effort)
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
        console.error("Auto-approve embedding failed:", e);
      }

      return {
        sourceName, sourceUrl,
        status: "auto-approved",
        scrapedId: scraped.id,
        beasiswaId: beasiswa.id,
      };
    }

    return { sourceName, sourceUrl, status: "scraped", scrapedId: scraped.id };
  } catch (e) {
    const errorMsg = (e as Error).message;

    // Rate-limit / quota exhaustion is transient — do NOT poison the DB with a
    // permanent REJECTED record. Mark the source so it gets retried next run.
    if (e instanceof GeminiRateLimitError) {
      console.warn(`Pipeline rate-limited for ${sourceUrl}: ${errorMsg}`);
      if (sourceId) {
        await prisma.scrapingSource.update({
          where: { id: sourceId },
          data: { lastRunAt: new Date(), lastStatus: "RATE_LIMITED: coba lagi nanti" },
        });
      }
      return { sourceName, sourceUrl, status: "rate-limited", error: errorMsg };
    }

    console.error(`Pipeline failed for ${sourceUrl}:`, errorMsg);

    if (sourceId) {
      await prisma.scrapingSource.update({
        where: { id: sourceId },
        data: { lastRunAt: new Date(), lastStatus: `FAILED: ${errorMsg.slice(0, 100)}` },
      });
    }

    await prisma.scrapedScholarship.create({
      data: {
        sourceName,
        sourceUrl,
        rawContent: "",
        status: "REJECTED",
        errorMessage: errorMsg,
      },
    });

    return { sourceName, sourceUrl, status: "failed", error: errorMsg };
  }
}
