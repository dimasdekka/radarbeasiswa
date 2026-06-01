import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where = search
    ? {
        OR: [
          { nama: { contains: search, mode: "insensitive" as const } },
          { provider: { contains: search, mode: "insensitive" as const } },
          { negara: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const beasiswa = await prisma.beasiswa.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      nama: true,
      provider: true,
      negara: true,
      jenjang: true,
      sourceType: true,
      verified: true,
      aktif: true,
      imageUrl: true,
      urlResmi: true,
      deadline: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ beasiswa, total: beasiswa.length });
}
