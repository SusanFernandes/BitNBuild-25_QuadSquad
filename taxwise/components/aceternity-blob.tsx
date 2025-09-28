"use client"

import * as React from "react"

type Props = {
  size?: "sm" | "md" | "lg"
  className?: string
  gradient?: string
}

export default function AceternityBlob({ size = "md", className = "", gradient }: Props) {
  const sizeClass = size === "lg" ? "blob blob--lg" : size === "sm" ? "blob blob--sm" : "blob"
  const bg = gradient
    ? gradient
    : "bg-blob-gradient"

  return (
    <div aria-hidden className={`${sizeClass} ${bg} rounded-full ${className}`} />
  )
}
