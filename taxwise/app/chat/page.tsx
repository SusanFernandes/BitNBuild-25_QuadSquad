import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import { ChatAssistant } from "@/components/chat-assistant"
import AceternityBlob from "@/components/aceternity-blob"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AccentIconRow, OutlineCard } from "@/components/pastel-accents"
import Link from "next/link"

export default function Page() {
  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-10">
        <section className="animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-extrabold flame">Ask AI about taxes, spending, and credit</h1>
          <p className="text-muted-foreground mt-2">Plain-language queries with sources and confidence levels. Try prompts or upload a statement to ask about it directly.</p>
        </section>

        <section className="relative p-6 rounded-2xl bg-card shadow animate-fade-in benzo">
          <div className="benzo-accent bg-gradient-to-tr from-orange-100 to-pink-100" />
          <div className="absolute -right-10 -top-8 -z-10">
            <AceternityBlob size="md" gradient="bg-gradient-to-tr from-indigo-100 via-pink-100 to-transparent" />
          </div>
          <div className="benzo-content">
            <ChatAssistant />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-2xl bg-card shadow">
            <div className="font-medium">Prompt ideas</div>
            <p className="text-sm text-muted-foreground mt-2">Summarize expenses, compare regimes, or ask for CIBIL improvement steps.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow">
            <div className="font-medium">Sources</div>
            <p className="text-sm text-muted-foreground mt-2">We show sources when available for transparency.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow">
            <div className="font-medium">Guardrails</div>
            <p className="text-sm text-muted-foreground mt-2">Verify outputs against official documents for tax filing.</p>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
