import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { ChecklistClient, type ChecklistMap } from "@/components/checklist-client";

export default async function ChecklistPage({
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
    include: { beasiswa: { select: { checklistDok: true } } },
  });
  if (!application || application.userId !== user.id) notFound();

  const checklist = (application.checklist as ChecklistMap) ?? {};

  return (
    <ChecklistClient applicationId={applicationId} initialChecklist={checklist} />
  );
}
