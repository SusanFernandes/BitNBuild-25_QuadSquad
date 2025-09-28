import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import CibilUploader from "@/components/cibil-uploader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
          <h1 className="text-2xl font-semibold">CIBIL</h1>
          <Button asChild variant="outline">
            <Link href="/reports?report_type=cibil">View CIBIL Reports</Link>
          </Button>
        </div>
        <CibilUploader />

        {/* Pastel reminders */}
        <section aria-labelledby="cibil-accents" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="cibil-accents" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Pastel reminders
          </h2>
          <AccentIconRow />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">Keep utilization under 30% for a healthier score.</div>
            </OutlineCard>
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">Enable auto-pay to avoid accidental late payments.</div>
            </OutlineCard>
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">Dispute errors with supporting documents.</div>
            </OutlineCard>
          </div>
        </section>

        {/* What affects your score */}
        <section aria-labelledby="cibil-factors" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-6">
            <h2 id="cibil-factors" className="text-pretty text-xl md:text-2xl font-semibold">
              What impacts your score
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Utilization</CardTitle>
                  <CardDescription>Keep it low</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Aim for credit card utilization under 30%.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment history</CardTitle>
                  <CardDescription>On-time matters</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Set up auto-pay to avoid accidental delays.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Credit mix</CardTitle>
                  <CardDescription>Diverse portfolio</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Healthy mix of secured and unsecured loans.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Improvement tips */}
        <section aria-labelledby="cibil-tips" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="cibil-tips" className="text-pretty text-xl md:text-2xl font-semibold mb-6">
            Score improvement tips
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Reduce utilization by requesting higher limits or part prepayments.
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Dispute incorrect entries with your bureau using documented proofs.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="cibil-faq" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
            <h2 id="cibil-faq" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
              CIBIL FAQ
            </h2>
            <Accordion type="single" collapsible>
              <AccordionItem value="how-often">
                <AccordionTrigger>How often does the score update?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Typically monthly, depending on lender reporting.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="hard-pulls">
                <AccordionTrigger>Do hard pulls hurt?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Multiple close hard inquiries can temporarily impact your score.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
