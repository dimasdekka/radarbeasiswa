"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AuthAside } from "@/components/auth/auth-aside";
import { GoogleButton } from "@/components/auth/google-button";
import { AlertCircle, ArrowRight, Loader2, Mail, Lock, User, Radar, LogIn } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registrasi gagal");
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="relative grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <AuthAside
        tag="Daftar"
        headline={<>Mulai perjalanan <span className="text-accent">beasiswa</span>mu.</>}
        sub="Cukup tiga isian untuk daftar — sisanya, AI yang bantu cocokkan beasiswa terbaik buat kamu."
      />

      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 -z-10 bg-dots opacity-60 lg:hidden" />
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Radar className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Radar<span className="text-gradient">Beasiswa</span>
            </span>
          </div>

          <div className="mb-6">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Daftar</p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">Buat akun barumu.</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Masuk
              </Link>
            </p>
          </div>

          <GoogleButton label="Daftar dengan Google" />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">atau email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" name="name" required placeholder="Nama lengkap kamu" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" required placeholder="kamu@email.com" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" name="password" type="password" required minLength={6} placeholder="Minimal 6 karakter" className="pl-9" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-none" />
                {error}
              </div>
            )}

            <Button type="submit" className="group w-full" disabled={loading} size="lg">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mendaftar...</>
              ) : (
                <>Daftar Gratis <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Setelah daftar, kami pandu setup profilmu (2 menit)
          </p>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">sudah punya akun?</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Link
            href="/auth/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            <LogIn className="h-4 w-4" />
            Masuk ke akunmu
          </Link>
        </div>
      </main>
    </div>
  );
}
