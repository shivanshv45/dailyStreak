"use client";

import { useState } from "react";
import Image from "next/image";

/** Renders a hand-made image from /public; shows `fallback` (or nothing) until the file exists. */
export function Art({ src, size, className = "", fallback = null }: { src: string; size: number; className?: string; fallback?: React.ReactNode }) {
  const [missing, setMissing] = useState(false);
  if (missing) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      draggable={false}
      onError={() => setMissing(true)}
      // the browser may report a 404 before React attached onError (server-rendered page), so also check on mount
      ref={(el) => {
        if (el && el.complete && el.naturalWidth === 0) setMissing(true);
      }}
      className={`shrink-0 select-none object-contain ${className}`}
    />
  );
}
