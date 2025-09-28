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

  return <div style={style}>{children}</div>
}
