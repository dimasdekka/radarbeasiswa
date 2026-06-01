import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileCvUpload } from "@/components/profile-cv-upload";

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, name: true, role: true } });

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">Profil</p>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Profilmu belum lengkap<span className="text-gradient">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Setup dulu agar AI bisa cocokin beasiswa yang paling pas. Cuma butuh ~2 menit.
        </p>
        <Link href="/onboarding" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
          Setup profil sekarang →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 border-b border-border/30 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent font-display text-2xl font-bold text-white shadow-lg shadow-primary/20">
            {(dbUser?.name ?? "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-primary">Profil saya</p>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{dbUser?.name ?? "—"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{dbUser?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={profile.tipe === "SMA" ? "secondary" : "default"}>{profile.tipe}</Badge>
          {dbUser?.role === "ADMIN" && <Badge variant="destructive">ADMIN</Badge>}
        </div>
      </header>

      {/* CV Upload Section */}
      <section className="mb-8">
        <ProfileCvUpload />
      </section>

      {/* Profile Data Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="hover-lift">
          <CardContent className="p-5">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">Akademik</p>
            <dl className="space-y-3">
              {profile.tipe === "SMA" ? (
                <>
                  <Field label="Kelas" value={profile.kelas ? `Kelas ${profile.kelas}` : null} />
                  <Field label="Sekolah" value={profile.namaSekolah} />
                  <Field label="Nilai rata-rata" value={profile.nilaiRataRata?.toString()} />
                </>
              ) : (
                <>
                  <Field label="Status" value={profile.jenjang?.replace("_", " ")} />
                  <Field label="Jurusan" value={profile.jurusan} />
                  <Field label="Universitas" value={profile.universitas} />
                  <Field label="IPK" value={profile.ipk?.toString()} />
                  <Field label="TOEFL" value={profile.toefl?.toString()} />
                  <Field label="IELTS" value={profile.ielts?.toString()} />
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-5">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">Target</p>
            <dl className="space-y-3">
              <Field label="Target jenjang" value={profile.targetJenjang} />
              <FieldList label="Target negara" items={profile.targetNegara} />
              <FieldList label="Target bidang" items={profile.targetBidang} />
              <Field label="Butuh full-funded" value={profile.butuhFinansial ? "Ya" : "Tidak"} />
            </dl>
          </CardContent>
        </Card>

        {profile.tipe === "SMA" ? (
          <>
            <Card className="hover-lift">
              <CardContent className="p-5">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">Prestasi</p>
                <ListItems items={profile.prestasi} />
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-5">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">Ekstrakurikuler</p>
                <ListItems items={profile.ekstrakurikuler} />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="hover-lift">
              <CardContent className="p-5">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">Pengalaman</p>
                <ListItems items={profile.pengalaman} />
              </CardContent>
            </Card>
            <Card className="hover-lift">
              <CardContent className="p-5">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">Publikasi / Penelitian</p>
                <ListItems items={profile.publikasi} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
        <Link href="/onboarding" className={cn(buttonVariants())}>Edit profil</Link>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>← Dashboard</Link>
      </div>

      <p className="mt-4 font-mono text-xs text-muted-foreground">
        Terakhir diperbarui · {new Date(profile.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || <span className="italic text-muted-foreground font-normal">belum diisi</span>}</dd>
    </div>
  );
}

function FieldList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex flex-wrap gap-1.5">
        {items.length > 0 ? items.map((i) => (
          <span key={i} className="rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium">{i}</span>
        )) : (
          <span className="text-sm italic text-muted-foreground">belum diisi</span>
        )}
      </dd>
    </div>
  );
}

function ListItems({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Belum ada</p>;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((p, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-primary">•</span>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}
