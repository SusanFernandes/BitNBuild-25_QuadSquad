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
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-10">
        <section className="grid md:grid-cols-2 gap-8 items-center animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">CIBIL insights and report parsing</h1>
            <p className="text-lg text-muted-foreground mt-2">Upload your CIBIL PDF report and get a clear breakdown with improvement steps.</p>
            <div className="mt-4">
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
                <Link href="/reports?report_type=cibil">View CIBIL reports</Link>
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <CibilUploader />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium">Utilization</div>
            <p className="text-sm text-muted-foreground mt-2">Keep credit utilization under 30% for best impact.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium">Payment history</div>
            <p className="text-sm text-muted-foreground mt-2">On-time payments matter most; set auto-pay where possible.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium">Credit mix</div>
            <p className="text-sm text-muted-foreground mt-2">A healthy mix of secured and unsecured credit improves profile.</p>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
