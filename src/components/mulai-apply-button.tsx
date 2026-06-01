"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MulaiApplyButton({ beasiswaId }: { beasiswaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beasiswaId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Gagal membuat aplikasi");
      return;
    }
    router.push(`/apply/${data.application.id}/essay`);
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Membuat workspace..." : "Mulai Apply"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
