import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/scraping?status=PENDING_REVIEW
 * Returns scraped records and sources for the admin panel.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const [scraped, sources] = await Promise.all([
    prisma.scrapedScholarship.findMany({
      where: status ? { status } : undefined,
      orderBy: { scrapedAt: "desc" },
      take: 100,
    }),
    prisma.scrapingSource.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({ scraped, sources });
}
