import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { EssayStudio } from "@/components/essay/essay-studio";
import type { ParagraphFeedback } from "@/components/essay/feedback-panel";

export default async function EssayPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { beasiswa: true, essays: true },
  });
  if (!application || application.userId !== user.id) notFound();

  // Ensure at least one essay exists; create default if none
  let essay = application.essays[0];
  if (!essay) {
    const defaultTitle = application.beasiswa.rubrikEssay
      ? `Essay Aplikasi ${application.beasiswa.nama}`
      : `Personal Statement — ${application.beasiswa.nama}`;
    essay = await prisma.essay.create({
      data: {
        applicationId,
        judul: defaultTitle,
        konten: "",
      },
    });
  }

  return (
    <EssayStudio
      essayId={essay.id}
      initialJudul={essay.judul}
      initialKonten={essay.konten}
      initialFeedback={(essay.feedback as ParagraphFeedback[] | null) ?? null}
      rubrikEssay={application.beasiswa.rubrikEssay as Record<string, string> | null}
    />
  );
}
