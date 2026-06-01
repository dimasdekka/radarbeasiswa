import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { researchScholarships } from "@/lib/ai-research";
import { runScrapingPipeline, type PipelineResult } from "@/lib/scraping-pipeline";

export const maxDuration = 300;

/**
 * POST /api/admin/scraping/research
 * Body: { query?: string, autoApprove?: boolean, scrape?: boolean }
 *
 * 1. Gemini (with Google Search grounding) discovers real scholarship URLs.
 * 2. Each discovered URL is run through the scrape → normalize → save pipeline.
 *
 * This is the "AI auto-research lalu scrape sendiri" flow.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const query: string | undefined = body.query;
  const autoApprove = !!body.autoApprove;
  const doScrape = body.scrape !== false; // default: also scrape

  let research;
  try {
    research = await researchScholarships(query);
  } catch (e) {
    return NextResponse.json({ error: `AI research gagal: ${(e as Error).message}` }, { status: 500 });
  }

  // Build a de-duplicated list of candidate URLs (structured list + grounding sources).
  const seen = new Set<string>();
  const candidates: { name: string; url: string }[] = [];
  for (const s of research.scholarships) {
    if (s.url && !seen.has(s.url)) {
      seen.add(s.url);
      candidates.push({ name: s.nama, url: s.url });
    }
  }
  for (const src of research.sources) {
    if (src.url && !seen.has(src.url)) {
      seen.add(src.url);
      candidates.push({ name: src.title, url: src.url });
    }
  }

  if (!doScrape) {
    return NextResponse.json({
      discovered: candidates.length,
      summary: research.summary,
      scholarships: research.scholarships,
      sources: research.sources,
    });
  }

  // Scrape each candidate through the existing pipeline (paced for rate limits).
  const delayMs = parseInt(process.env.SCRAPE_DELAY_MS ?? "5000", 10);
  const results: PipelineResult[] = [];
  const max = Math.min(candidates.length, 15);
  for (let i = 0; i < max; i++) {
    const c = candidates[i];
    let host = c.name;
    try { host = new URL(c.url).hostname; } catch { /* keep name */ }
    const result = await runScrapingPipeline({
      sourceName: c.name || host,
      sourceUrl: c.url,
      autoApprove,
      reviewedBy: `ai-research:${admin.email}`,
    });
    results.push(result);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  return NextResponse.json({
    discovered: candidates.length,
    scraped: results.length,
    summary: research.summary,
    summaryCounts: {
      scraped: results.filter((r) => r.status === "scraped").length,
      autoApproved: results.filter((r) => r.status === "auto-approved").length,
      duplicate: results.filter((r) => r.status === "duplicate").length,
      failed: results.filter((r) => r.status === "failed").length,
      rateLimited: results.filter((r) => r.status === "rate-limited").length,
    },
    results,
  });
}
