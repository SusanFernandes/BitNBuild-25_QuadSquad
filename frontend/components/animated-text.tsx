"use client"

import React from "react"
import { cn } from "@/lib/utils"

type AnimatedTextProps = {
  words: string[]
  className?: string
  typingSpeedMs?: number
  deleteSpeedMs?: number
  pauseBetweenWordsMs?: number
}

export default function AnimatedText({
  words,
  className,
  typingSpeedMs = 60,
  deleteSpeedMs = 35,
  pauseBetweenWordsMs = 900,
}: AnimatedTextProps) {
  const [wordIndex, setWordIndex] = React.useState(0)
  const [display, setDisplay] = React.useState("")
  const [phase, setPhase] = React.useState<"typing" | "pausing" | "deleting">("typing")

  const currentWord = words[wordIndex % words.length]

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    if (phase === "typing") {
      if (display.length < currentWord.length) {
        timeout = setTimeout(() => setDisplay(currentWord.slice(0, display.length + 1)), typingSpeedMs)
      } else {
        setPhase("pausing")
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), pauseBetweenWordsMs)
    } else if (phase === "deleting") {
      if (display.length > 0) {
        timeout = setTimeout(() => setDisplay(currentWord.slice(0, display.length - 1)), deleteSpeedMs)
      } else {
        setWordIndex((i) => (i + 1) % words.length)
        setPhase("typing")
      }
    }

    return () => timeout && clearTimeout(timeout)
  }, [phase, display, currentWord, typingSpeedMs, deleteSpeedMs, pauseBetweenWordsMs, words.length])

  React.useEffect(() => {
    if (display === currentWord && phase === "typing") setPhase("pausing")
  }, [display, currentWord, phase])

  return (
    <span className={cn("relative inline-flex items-baseline", className)} aria-live="polite" aria-atomic="true">
      <span>{display}</span>
      {/* blinking cursor */}
      <span
        aria-hidden="true"
        className="ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] bg-foreground"
        style={{ animation: "v0-cursor-blink 1s steps(1,end) infinite" }}
      />
      <style jsx>{`
        @keyframes v0-cursor-blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </span>
  )
}
