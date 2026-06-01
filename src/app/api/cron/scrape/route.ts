import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runScrapingPipeline, type PipelineResult } from "@/lib/scraping-pipeline";

export const maxDuration = 300;

/**
 * GET /api/cron/scrape
 *
 * Cron endpoint that runs scraping for ALL active sources.
 * Designed to be called by Google Cloud Scheduler.
 *
 * Auth: requires header `Authorization: Bearer ${CRON_SECRET}` OR
 *       query param ?secret=${CRON_SECRET}.
 *
 * Auto-approves high-confidence entries when AUTO_APPROVE_HIGH_CONFIDENCE=true.
 *
 * Per PRD section 4.5 — Cloud Scheduler triggers scraping berkala.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  const provided =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ?? querySecret;

  if (provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await prisma.scrapingSource.findMany({ where: { active: true } });

  // Optionally filter by schedule (DAILY/WEEKLY/MONTHLY) via query
  const scheduleFilter = url.searchParams.get("schedule");
  const filtered = scheduleFilter
    ? sources.filter((s) => s.schedule === scheduleFilter)
    : sources;

  if (filtered.length === 0) {
    return NextResponse.json({ message: "No sources to scrape", total: 0, results: [] });
  }

  const autoApprove = process.env.AUTO_APPROVE_HIGH_CONFIDENCE === "true";

  // Pace requests to stay under the free-tier RPM. Configurable via env.
  const delayMs = parseInt(process.env.SCRAPE_DELAY_MS ?? "5000", 10);

  console.log(`🤖 Cron scraping ${filtered.length} sources (autoApprove=${autoApprove}, delay=${delayMs}ms)`);

  const results: PipelineResult[] = [];
  for (const source of filtered) {
    const result = await runScrapingPipeline({
      sourceName: source.name,
      sourceUrl: source.url,
      sourceId: source.id,
      autoApprove,
      reviewedBy: "cron",
    });
    results.push(result);
    console.log(`  ${result.status} — ${result.sourceName}`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  const summary = {
    scraped: results.filter((r) => r.status === "scraped").length,
    autoApproved: results.filter((r) => r.status === "auto-approved").length,
    duplicate: results.filter((r) => r.status === "duplicate").length,
    failed: results.filter((r) => r.status === "failed").length,
    rateLimited: results.filter((r) => r.status === "rate-limited").length,
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    total: results.length,
    summary,
    results,
  });
}
