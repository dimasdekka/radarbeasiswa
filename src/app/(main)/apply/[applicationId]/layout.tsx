import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ApplyTabs } from "@/components/apply-tabs";

export default async function ApplyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { beasiswa: { select: { nama: true, provider: true, deadline: true } } },
  });
  if (!application || application.userId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link
        href="/beasiswa"
        className="mb-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
      >
        ← Direktori
      </Link>

      {/* Workspace header */}
      <header className="mb-6 flex items-end justify-between gap-4 border-b border-border/30 pb-5">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
            Application Workspace
          </p>
          <h1 className="line-clamp-2 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {application.beasiswa.nama}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{application.beasiswa.provider}</p>
        </div>
        <div className="flex flex-none flex-col items-end gap-2">
          <Badge>{application.status.replace("_", " ")}</Badge>
          <p className="font-mono text-[10px] uppercase tracking-widest tabular text-muted-foreground">
            Match {Math.round(application.matchScore)}%
          </p>
        </div>
      </header>

      <ApplyTabs applicationId={applicationId} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
