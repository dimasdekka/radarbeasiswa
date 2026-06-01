import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/sources — list all
 * POST /api/admin/sources — create new
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await prisma.scrapingSource.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.name || !body.url) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 });
  }

  // Validate URL
  try {
    new URL(body.url);
  } catch {
    return NextResponse.json({ error: "URL tidak valid" }, { status: 400 });
  }

  const source = await prisma.scrapingSource.create({
    data: {
      name: body.name,
      url: body.url,
      type: body.type ?? "OFFICIAL",
      schedule: body.schedule ?? "MONTHLY",
      active: body.active ?? true,
    },
  });

  return NextResponse.json({ source });
}
