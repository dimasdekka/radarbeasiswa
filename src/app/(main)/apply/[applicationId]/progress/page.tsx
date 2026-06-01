import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProgressClient } from "@/components/progress-client";
import type { ChecklistMap } from "@/components/checklist-client";

export default async function ProgressPage({
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
    include: { beasiswa: { select: { deadline: true, deadlineNote: true } }, essays: { select: { id: true } } },
  });
  if (!application || application.userId !== user.id) notFound();

  const checklist = (application.checklist as ChecklistMap) ?? {};
  const checklistTotal = Object.keys(checklist).length;
  const checklistReady = Object.values(checklist).filter((c) => c.ready).length;

  return (
    <ProgressClient
      applicationId={applicationId}
      initialStatus={application.status}
      deadline={application.beasiswa.deadline?.toISOString() ?? null}
      deadlineNote={application.beasiswa.deadlineNote}
      essayCount={application.essays.length}
      checklistReady={checklistReady}
      checklistTotal={checklistTotal}
    />
  );
}
