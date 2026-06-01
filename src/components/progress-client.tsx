"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STAGES = [
  { value: "RISET", label: "Riset", desc: "Pelajari beasiswa & syarat" },
  { value: "ESSAY", label: "Essay", desc: "Tulis & revisi essay" },
  { value: "DOKUMEN", label: "Dokumen", desc: "Lengkapi semua dokumen" },
  { value: "SUBMIT", label: "Submit", desc: "Kirim aplikasi" },
  { value: "MENUNGGU_HASIL", label: "Menunggu Hasil", desc: "Tunggu pengumuman" },
];

export function ProgressClient({
  applicationId,
  initialStatus,
  deadline,
  deadlineNote,
  essayCount,
  checklistReady,
  checklistTotal,
}: {
  applicationId: string;
  initialStatus: string;
  deadline: string | null;
  deadlineNote: string | null;
  essayCount: number;
  checklistReady: number;
  checklistTotal: number;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  const currentIdx = STAGES.findIndex((s) => s.value === status);

  async function setStage(value: string) {
    setSaving(true);
    setStatus(value);
    await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setSaving(false);
  }

  const daysLeft = deadline
    ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
    : null;

  const dangerZone = daysLeft !== null && daysLeft <= 7;

  return (
    <div className="space-y-6">
      {/* Deadline banner */}
      <div className={cn(
        "rounded-2xl border border-l-4 p-6 backdrop-blur-sm",
        dangerZone ? "border-destructive/30 border-l-destructive bg-destructive/5" : "border-border/40 border-l-primary bg-card/50"
      )}>
        <p className={cn(
          "mb-1 font-mono text-[11px] font-bold uppercase tracking-widest",
          dangerZone ? "text-destructive" : "text-muted-foreground"
        )}>
          {dangerZone ? "Deadline mendekat" : "Deadline"}
        </p>
        {deadline ? (
          <>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {new Date(deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </h2>
            {daysLeft !== null && (
              <p className={cn(
                "mt-1 font-display text-xl",
                dangerZone ? "font-semibold text-destructive" : "text-muted-foreground"
              )}>
                {daysLeft >= 0 ? <><span className="tabular">{daysLeft}</span> hari lagi</> : <><span className="italic">Lewat </span><span className="tabular">{Math.abs(daysLeft)}</span> hari</>}
              </p>
            )}
          </>
        ) : (
          <h2 className="font-display text-2xl italic text-muted-foreground">{deadlineNote ?? "Belum diumumkan"}</h2>
        )}
      </div>

      {/* Stepper */}
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent font-bold">Status aplikasi</p>
          {saving && <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Menyimpan...</span>}
        </div>

        <ol className="divide-y divide-border/20">
          {STAGES.map((stage, i) => {
            const completed = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li
                key={stage.value}
                className={cn(
                  "flex items-center gap-4 p-4 transition-colors",
                  active && "bg-primary/5",
                  completed && "bg-accent/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 flex-none items-center justify-center rounded-xl font-mono text-xs font-bold transition-colors",
                    active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" :
                    completed ? "bg-accent text-accent-foreground" :
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {completed ? "✓" : String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p className={cn(
                    "font-display text-lg font-bold leading-tight tracking-tight",
                    !active && !completed && "text-muted-foreground"
                  )}>
                    {stage.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{stage.desc}</p>
                </div>
                {!active && !completed && (
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => setStage(stage.value)}
                  >
                    Set aktif
                  </Button>
                )}
                {active && i < STAGES.length - 1 && (
                  <Button
                    size="sm"
                    onClick={() => setStage(STAGES[i + 1].value)}
                  >
                    Selesai →
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCell label="Essay tersimpan" value={essayCount} />
        <StatCell label="Dokumen siap" value={`${checklistReady}/${checklistTotal}`} />
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
      <div className="font-display text-4xl font-bold leading-none tracking-tight tabular text-foreground">{value}</div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
