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
import { AlertCircle, ArrowRight, Loader2, Mail, Lock, Radar, UserPlus } from "lucide-react";

export default function LoginPage() {
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

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Login gagal");
      return;
    }

    const dest = data.role === "ADMIN" ? "/admin/scraping-review" : "/dashboard";
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="relative grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <AuthAside
        tag="Login"
        headline={<>Selamat datang <span className="text-accent">kembali</span>.</>}
        sub="Masuk untuk lanjut tracking aplikasi, lihat match score terbaru, dan dapat reminder deadline."
      />

      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 -z-10 bg-dots opacity-60 lg:hidden" />
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Radar className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Radar<span className="text-gradient">Beasiswa</span>
            </span>
          </div>

          <div className="mb-8">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Login</p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">Masuk ke akunmu.</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/auth/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                Daftar gratis
              </Link>
            </p>
          </div>

          <GoogleButton label="Masuk dengan Google" />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">atau email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                <Input id="password" name="password" type="password" required placeholder="••••••••" className="pl-9" />
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
                <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
              ) : (
                <>Masuk <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Lupa password? Hubungi admin
          </p>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">belum punya akun?</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Link
            href="/auth/register"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            <UserPlus className="h-4 w-4" />
            Daftar gratis
          </Link>
        </div>
      </main>
    </div>
  );
}
