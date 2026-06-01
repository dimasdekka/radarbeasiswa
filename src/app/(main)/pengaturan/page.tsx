import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsThemeRow, LogoutRow } from "@/components/settings-client";
import { User, Palette, ShieldCheck, Compass } from "lucide-react";

export default async function PengaturanPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true, role: true, createdAt: true },
  });
  const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { tipe: true } });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 border-b border-border/30 pb-6">
        <p className="mb-2.5 font-mono text-xs font-bold uppercase tracking-widest text-primary">Pengaturan</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Kelola akun &amp; preferensi<span className="text-primary">.</span>
        </h1>
      </header>

      <div className="space-y-6">
        {/* Account */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Akun</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent font-display text-xl font-bold text-white shadow-lg shadow-primary/20">
                {(dbUser?.name ?? "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-foreground">{dbUser?.name ?? "—"}</p>
                <p className="truncate text-sm text-muted-foreground">{dbUser?.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {profile?.tipe && <Badge variant="secondary">{profile.tipe}</Badge>}
                {dbUser?.role === "ADMIN" && <Badge variant="destructive">Admin</Badge>}
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border/20 pt-5">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Bergabung</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-accent">
                  <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Tampilan</h2>
            </div>
            <SettingsThemeRow />
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Navigasi</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/profil" className={cn(buttonVariants({ variant: "outline" }), "text-xs font-bold uppercase tracking-wider")}>Lihat Profil</Link>
              <Link href="/onboarding" className={cn(buttonVariants({ variant: "outline" }), "text-xs font-bold uppercase tracking-wider")}>Edit Data Akademik</Link>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "text-xs font-bold uppercase tracking-wider")}>Dashboard</Link>
            </div>
          </CardContent>
        </Card>

        {/* Danger / logout */}
        <Card className="border-destructive/30">
          <CardContent className="p-6">
            <LogoutRow />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
