import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import { ChatAssistant } from "@/components/chat-assistant"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AccentIconRow, OutlineCard } from "@/components/pastel-accents"
import Link from "next/link"

export default function Page() {
  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8 grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">AI Chat</h1>
          <Button asChild variant="outline">
            <Link href="/reports?report_type=chat">View Chat History</Link>
          </Button>
        </div>
        <ChatAssistant />

        {/* Pastel prompt ideas */}
        <section aria-labelledby="chat-accents" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="chat-accents" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Pastel prompt ideas
          </h2>
          <AccentIconRow />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">“Summarize my top 5 expense categories this quarter.”</div>
            </OutlineCard>
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">“Create a checklist for Old vs New regime decision.”</div>
            </OutlineCard>
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">“Suggest steps to raise CIBIL by 50 points.”</div>
            </OutlineCard>
          </div>
        </section>

        {/* Prompt ideas */}
        <section aria-labelledby="prompt-ideas" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-6">
            <h2 id="prompt-ideas" className="text-pretty text-xl md:text-2xl font-semibold">
              Try these prompts
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  “Compare Old vs New tax for 18L salary with 80C=1.5L, 80D=25k.”
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  “Categorize this CSV and summarize top 3 expense buckets.”
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  “Give me steps to improve CIBIL from 680 to 750 in 3 months.”
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tips & guardrails */}
        <section aria-labelledby="guardrails" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Be specific</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Include numbers, goals, and constraints for best results.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verify & act</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use the outputs as guidance and verify against official rules.
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <Button>Open sample conversation</Button>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="chat-faq" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
            <h2 id="chat-faq" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
              Chat FAQ
            </h2>
            <Accordion type="single" collapsible>
              <AccordionItem value="privacy">
                <AccordionTrigger>Is my chat history saved?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Conversations can be cleared; sensitive data is handled securely.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="sources">
                <AccordionTrigger>Do you show sources?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  We surface references when available for transparency.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
