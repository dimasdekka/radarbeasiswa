import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          Radar<span className="italic text-primary">Beasiswa</span>
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Platform AI pendamping pendaftaran beasiswa pelajar Indonesia.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
          © 2026 · JuaraVibeCoding
        </p>
      </div>
    </footer>
  );
}
