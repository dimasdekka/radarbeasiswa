import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { runScrapingPipeline, type PipelineResult } from "@/lib/scraping-pipeline";

export const maxDuration = 300;

/**
 * POST /api/admin/scraping/run
 * Body shapes (any of):
 *   { sourceId: string }              → run for one source
 *   { url: string }                   → ad-hoc URL
 *   { runAll: true, autoApprove?: bool } → run for all active sources
 *
 * Per PRD section 4.5 — full scrape → normalize → optional auto-approve flow.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  // Run for ALL active sources
  if (body.runAll) {
    const sources = await prisma.scrapingSource.findMany({ where: { active: true } });
    if (sources.length === 0) {
      return NextResponse.json({ error: "No active sources" }, { status: 400 });
    }

    const results: PipelineResult[] = [];
    const delayMs = parseInt(process.env.SCRAPE_DELAY_MS ?? "5000", 10);
    for (const source of sources) {
      const result = await runScrapingPipeline({
        sourceName: source.name,
        sourceUrl: source.url,
        sourceId: source.id,
        autoApprove: !!body.autoApprove,
        reviewedBy: admin.email,
      });
      results.push(result);
      // Pace so we don't slam the Gemini free-tier RPM
      await new Promise((r) => setTimeout(r, delayMs));
    }

    return NextResponse.json({
      total: results.length,
      summary: {
        scraped: results.filter((r) => r.status === "scraped").length,
        autoApproved: results.filter((r) => r.status === "auto-approved").length,
        duplicate: results.filter((r) => r.status === "duplicate").length,
        failed: results.filter((r) => r.status === "failed").length,
        rateLimited: results.filter((r) => r.status === "rate-limited").length,
      },
      results,
    });
  }

  // Run for one source by ID
  if (body.sourceId) {
    const source = await prisma.scrapingSource.findUnique({ where: { id: body.sourceId } });
    if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

    const result = await runScrapingPipeline({
      sourceName: source.name,
      sourceUrl: source.url,
      sourceId: source.id,
      autoApprove: !!body.autoApprove,
      reviewedBy: admin.email,
    });
    return NextResponse.json(result);
  }

  // Ad-hoc URL
  if (body.url) {
    const result = await runScrapingPipeline({
      sourceName: new URL(body.url).hostname,
      sourceUrl: body.url,
      autoApprove: !!body.autoApprove,
      reviewedBy: admin.email,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "sourceId, url, or runAll required" }, { status: 400 });
}
