"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Heart, Star, Leaf, Sparkles } from "lucide-react"

export function AccentIconRow({
  className,
  size = 18,
}: {
  className?: string
  size?: number
}) {
  const pink: React.CSSProperties = { color: "var(--accent-pink)" }
  const green: React.CSSProperties = { color: "var(--accent-green)" }

  return (
    <div className={cn("flex items-center justify-center gap-4 py-4", className)} aria-hidden="true">
      <Heart size={size} style={pink} />
      <Star size={size} style={green} />
      <Leaf size={size} style={pink} />
      <Sparkles size={size} style={green} />
      <Star size={size} style={pink} />
      <Leaf size={size} style={green} />
    </div>
  )
}

export function OutlineCard({
  children,
  className,
  accent = "pink",
}: {
  children: React.ReactNode
  className?: string
  accent?: "pink" | "green"
}) {
  const borderStyle: React.CSSProperties =
    accent === "green" ? { borderColor: "var(--accent-green)" } : { borderColor: "var(--accent-pink)" }

  return (
    <div className={cn("rounded-lg border bg-background text-foreground p-4 md:p-6", className)} style={borderStyle}>
      {children}
    </div>
  )
}
