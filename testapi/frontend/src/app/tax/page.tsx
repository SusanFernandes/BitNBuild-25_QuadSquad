import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import TaxAnalysisForm from "@/components/tax-analysis-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AccentIconRow, OutlineCard } from "@/components/pastel-accents"

export default function Page() {
  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8 grid gap-6">
        <h1 className="text-2xl font-semibold">Tax</h1>
        <TaxAnalysisForm />

        {/* Regime comparison */}
        <section aria-labelledby="tax-comparison" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-6">
            <h2 id="tax-comparison" className="text-pretty text-xl md:text-2xl font-semibold">
              Old vs New regime
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Old Regime</CardTitle>
                  <CardDescription>Deduction-heavy</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground grid gap-2">
                  <div>• 80C, 80D, HRA, NPS, 24b allowed</div>
                  <div>• Best if you claim many deductions</div>
                  <div>• More documentation</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">New Regime</CardTitle>
                  <CardDescription>Simplified slabs</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground grid gap-2">
                  <div>• Fewer deductions, lower rates</div>
                  <div>• Great for low-deduction taxpayers</div>
                  <div>• Less paperwork</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Deductions guide */}
        <section aria-labelledby="deductions" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="deductions" className="text-pretty text-xl md:text-2xl font-semibold mb-6">
            Popular deductions explained
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">80C</CardTitle>
                <CardDescription>Investments & instruments</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                PPF, ELSS, EPF, principal on home loan.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">80D</CardTitle>
                <CardDescription>Health insurance</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Premiums for self, family, parents.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">24b</CardTitle>
                <CardDescription>Home loan interest</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Interest on self-occupied property.</CardContent>
            </Card>
          </div>
        </section>

        {/* Pastel accents */}
        <section aria-labelledby="tax-accents" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="tax-accents" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Pastel tips
          </h2>
          <AccentIconRow />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">Max 80C with PPF/ELSS/EPF to reduce taxable income.</div>
            </OutlineCard>
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">
                Compare regimes yearly—deductions change your break-even.
              </div>
            </OutlineCard>
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">Track Section 24b interest caps for accurate claims.</div>
            </OutlineCard>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="tax-faq" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
            <h2 id="tax-faq" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
              Tax FAQ
            </h2>
            <Accordion type="single" collapsible>
              <AccordionItem value="switch">
                <AccordionTrigger>Can I switch regimes every year?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Most salaried individuals can choose each year before filing; consult latest rules.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="proofs">
                <AccordionTrigger>What proofs do I need?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Receipts and statements for 80C/80D/24b and other claimed deductions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-6">
              <Button>Run tax comparison again</Button>
            </div>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
