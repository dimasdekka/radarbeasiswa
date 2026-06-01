import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, profileToText } from "@/lib/embedding";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Ensure User row exists (for older accounts created before Prisma User row)
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? null,
    },
    update: {},
  });

  // Upsert profile (without embedding — must be set via raw SQL because of vector type)
  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      tipe: body.tipe,
      kelas: body.kelas ?? null,
      namaSekolah: body.namaSekolah ?? null,
      nilaiRataRata: body.nilaiRataRata ?? null,
      prestasi: body.prestasi ?? [],
      jenjang: body.jenjang ?? null,
      jurusan: body.jurusan ?? null,
      universitas: body.universitas ?? null,
      ipk: body.ipk ?? null,
      toefl: body.toefl ?? null,
      ielts: body.ielts ?? null,
      pengalaman: body.pengalaman ?? [],
      publikasi: body.publikasi ?? [],
      ekstrakurikuler: body.ekstrakurikuler ?? [],
      targetJenjang: body.targetJenjang ?? null,
      targetNegara: body.targetNegara ?? [],
      targetBidang: body.targetBidang ?? [],
      butuhFinansial: body.butuhFinansial ?? false,
    },
    update: {
      tipe: body.tipe,
      kelas: body.kelas ?? null,
      namaSekolah: body.namaSekolah ?? null,
      nilaiRataRata: body.nilaiRataRata ?? null,
      prestasi: body.prestasi ?? [],
      jenjang: body.jenjang ?? null,
      jurusan: body.jurusan ?? null,
      universitas: body.universitas ?? null,
      ipk: body.ipk ?? null,
      toefl: body.toefl ?? null,
      ielts: body.ielts ?? null,
      pengalaman: body.pengalaman ?? [],
      publikasi: body.publikasi ?? [],
      ekstrakurikuler: body.ekstrakurikuler ?? [],
      targetJenjang: body.targetJenjang ?? null,
      targetNegara: body.targetNegara ?? [],
      targetBidang: body.targetBidang ?? [],
      butuhFinansial: body.butuhFinansial ?? false,
    },
  });

  // Generate embedding asynchronously - if it fails, profile is still saved
  try {
    const text = profileToText(body);
    const embedding = await generateEmbedding(text);
    const vectorString = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "Profile" SET embedding = $1::vector WHERE id = $2`,
      vectorString,
      profile.id
    );
  } catch (e) {
    console.error("Embedding generation failed:", e);
    // Don't fail the request — profile saved without embedding
  }

  return NextResponse.json({ success: true, profile });
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Only update fields that are non-null in the parsed CV data
  const updateData: Record<string, unknown> = {};
  const fields = [
    "tipe", "kelas", "namaSekolah", "nilaiRataRata", "prestasi",
    "jenjang", "jurusan", "universitas", "ipk", "toefl", "ielts",
    "pengalaman", "publikasi", "ekstrakurikuler", "targetJenjang",
    "targetNegara", "targetBidang", "butuhFinansial",
  ];

  for (const f of fields) {
    const v = body[f];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "string" && v === "") continue;
    updateData[f] = v;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No data to update" }, { status: 400 });
  }

  const profile = await prisma.profile.update({
    where: { userId: user.id },
    data: updateData,
  });

  // Re-generate embedding
  try {
    const full = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (full) {
      const text = profileToText(full);
      const embedding = await generateEmbedding(text);
      const vectorString = `[${embedding.join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "Profile" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        profile.id
      );
    }
  } catch (e) {
    console.error("Embedding generation failed:", e);
  }

  return NextResponse.json({ success: true, profile });
}
