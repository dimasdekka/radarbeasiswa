import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * PATCH /api/admin/scraping/[id]
 * Body: { normalizedData: object } — admin edits before approval.
 * GET returns single scraped record.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const scraped = await prisma.scrapedScholarship.findUnique({ where: { id } });
  if (!scraped) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ scraped });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.scrapedScholarship.update({
    where: { id },
    data: {
      normalizedData: body.normalizedData ?? undefined,
      status: body.status ?? undefined,
    },
  });

  return NextResponse.json({ success: true, scraped: updated });
}
