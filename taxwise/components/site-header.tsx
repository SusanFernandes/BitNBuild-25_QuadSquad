"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/", label: "Home" },
  { href: "/statements", label: "Statements" },
  { href: "/tax", label: "Tax" },
  { href: "/cibil", label: "CIBIL" },
  { href: "/chat", label: "AI Chat" },
  { href: "/reports", label: "Reports" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/health", label: "Health" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="w-full backdrop-blur-sm bg-white/60 dark:bg-black/40 border-b sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">TW</div>
            <div className="hidden sm:block">
              <div className="font-semibold text-lg leading-none">TaxWise</div>
              <div className="text-xs text-muted-foreground -mt-0.5">AI financial assistant</div>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm px-3 py-2 rounded-md transition-all duration-150 ease-in-out transform hover:-translate-y-0.5 ${
                  active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
              <Link href="/statements">Get started</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Button asChild size="sm" className="bg-primary text-primary-foreground">
              <Link href="/chat">Ask AI</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
