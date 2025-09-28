"use client"

import type * as React from "react"

type Props = {
  children: React.ReactNode
}

/**
 * Overrides shadcn/ui CSS variables in a subtree to use Prussian Blue as primary.
 * This avoids editing global theme while satisfying the color requirement.
 */
export function BrandThemeWrapper({ children }: Props) {
  const style = {
    // Prussian Blue palette
    ["--primary" as any]: "#0B3C5D",
    ["--primary-foreground" as any]: "white",
    ["--ring" as any]: "#0B3C5D",
    // Pastel accents (within 5-color palette)
    ["--accent-pink" as any]: "#F8BBD0",
    ["--accent-green" as any]: "#B7E4C7",
    // Pastel accent CSS variables for icons and outlines
    ["--accent-icon-pink" as any]: "#FF80AB",
    ["--accent-icon-green" as any]: "#80CBC4",
    ["--accent-outline-pink" as any]: "#E91E63",
    ["--accent-outline-green" as any]: "#4CAF50",
  } as React.CSSProperties & Record<string, string>

  return (
    <div style={style} className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white dark:from-black/60 dark:via-black/40">
      {/* Aceternity-style decorative blobs (behind content) */}
      <div className="pointer-events-none absolute left-[-120px] top-[-80px] -z-20 blob blob--lg bg-blob-gradient rounded-full" />
      <div className="pointer-events-none absolute right-[-80px] bottom-[-60px] -z-20 blob blob--sm bg-gradient-to-tr from-pink-200 via-indigo-100 to-transparent rounded-full opacity-70" />
      {/* animated subtle accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 animate-[pulse_8s_ease-in-out_infinite] bg-gradient-to-br from-indigo-50 via-transparent to-pink-50 dark:from-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
