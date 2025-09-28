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
    <header className="w-full border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-balance">
          TaxWise AI
        </Link>
        <nav className="hidden md:flex items-center gap-3">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm px-3 py-2 rounded-md ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="md:hidden">
          <Button asChild size="sm" className="bg-primary text-primary-foreground">
            <Link href="/chat">Ask AI</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
