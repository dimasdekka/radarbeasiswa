"use client";

import { useState } from "react";
import Image from "next/image";
import { getProviderLogo } from "@/lib/scholarship-logos";

/**
 * Detail-page hero banner with a 3-tier fallback:
 *   1. scholarship image  2. provider/campus logo  3. initials on gradient.
 */
export function BeasiswaHeroImage({
  imageUrl,
  urlResmi,
  nama,
}: {
  imageUrl?: string | null;
  urlResmi?: string | null;
  nama: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const providerLogo = getProviderLogo(urlResmi);
  const initials = nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  if (imageUrl && !imgFailed) {
    return (
      <Image
        src={imageUrl}
        alt={nama}
        width={1280}
        height={720}
        className="h-full w-full object-cover"
        unoptimized
        onError={() => setImgFailed(true)}
      />
    );
  }

  if (providerLogo && !logoFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/95 p-4 shadow-xl ring-1 ring-black/5">
          <Image
            src={providerLogo}
            alt={nama}
            width={112}
            height={112}
            className="max-h-full max-w-full object-contain"
            unoptimized
            onError={() => setLogoFailed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute h-48 w-48 animate-pulse rounded-full bg-white/10 blur-2xl" />
      <span className="relative z-10 text-5xl font-black tracking-tighter text-white/95 drop-shadow-md">
        {initials}
      </span>
    </div>
  );
}
