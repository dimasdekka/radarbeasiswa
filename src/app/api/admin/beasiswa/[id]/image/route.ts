import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { scrapePage } from "@/lib/scraper";

export const maxDuration = 60;

/**
 * POST /api/admin/beasiswa/[id]/image
 * Auto-discovers a banner/logo image for a beasiswa by scraping its official
 * URL for og:image / prominent images. Returns candidates; does not save.
 *
 * Body (optional): { url?: string } to scan a specific URL instead of urlResmi.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const beasiswa = await prisma.beasiswa.findUnique({
    where: { id },
    select: { urlResmi: true, sourceUrl: true, nama: true },
  });
  if (!beasiswa) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const target = body.url || beasiswa.urlResmi || beasiswa.sourceUrl;
  if (!target) {
    return NextResponse.json({ error: "Tidak ada URL untuk discan" }, { status: 400 });
  }

  try {
    const raw = await scrapePage(target);
    const candidates: string[] = [];
    if (raw.ogImage) candidates.push(raw.ogImage);
    for (const img of raw.images) {
      if (!candidates.includes(img)) candidates.push(img);
    }
    return NextResponse.json({
      ogImage: raw.ogImage,
      candidates: candidates.slice(0, 8),
      scannedUrl: target,
    });
  } catch (e) {
    return NextResponse.json({ error: `Gagal scan gambar: ${(e as Error).message}` }, { status: 500 });
  }
}
