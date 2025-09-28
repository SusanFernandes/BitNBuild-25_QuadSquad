import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import TaxAnalysisForm from "@/components/tax-analysis-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AccentIconRow, OutlineCard } from "@/components/pastel-accents"
import Link from "next/link"

export default function Page() {
  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-10">
        <section className="grid md:grid-cols-2 gap-8 items-center animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Tax analysis & regime comparison</h1>
            <p className="text-lg text-muted-foreground mt-2">Compare Old vs New regimes and get deduction recommendations tailored to your income and investments.</p>
            <div className="mt-4">
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
                <Link href="/reports?report_type=tax">View tax reports</Link>
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <TaxAnalysisForm />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium">Old Regime</div>
            <p className="text-sm text-muted-foreground mt-2">Deduction-heavy; ideal when you claim many exemptions and investments.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium">New Regime</div>
            <p className="text-sm text-muted-foreground mt-2">Simplified slabs; fewer deductions but lower paperwork.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium">Deductions guide</div>
            <p className="text-sm text-muted-foreground mt-2">80C, 80D, 24b and common claim helpers explained simply.</p>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
