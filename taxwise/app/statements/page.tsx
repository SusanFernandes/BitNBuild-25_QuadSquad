import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import StatementsUploader from "@/components/statements-uploader"
import AceternityBlob from "@/components/aceternity-blob"
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
        <section className="flex flex-col md:flex-row items-center gap-10 animate-fade-in">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Upload your bank statements</h1>
            <p className="text-lg text-muted-foreground max-w-xl">CSV, Excel, and PDF supported. Get instant categorization and actionable insights.</p>
            <div className="flex gap-3 mt-4">
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white shadow-lg">
                <Link href="/reports?report_type=transaction">View Reports</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative animate-float-slow">
            <div className="absolute -left-16 -top-10 -z-10">
              <AceternityBlob size="sm" />
            </div>
            <div className="benzo">
              <div className="benzo-accent bg-gradient-to-br from-indigo-100 via-pink-100 opacity-60" />
              <div className="benzo-content p-6">
                <StatementsUploader />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-2xl bg-card shadow hover:shadow-lg transition-shadow animate-fade-in">
            <div className="font-medium text-lg">Auto-categorized</div>
            <p className="text-sm text-muted-foreground mt-2">EMIs, SIPs, rent, utilities, refunds—tagged automatically.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow hover:shadow-lg transition-shadow animate-fade-in">
            <div className="font-medium text-lg">Trends</div>
            <p className="text-sm text-muted-foreground mt-2">Spot patterns and outliers to take action faster.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow hover:shadow-lg transition-shadow animate-fade-in">
            <div className="font-medium text-lg">Export</div>
            <p className="text-sm text-muted-foreground mt-2">Download CSVs or summaries for your records.</p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium text-lg">Supported formats</div>
            <p className="text-sm text-muted-foreground mt-2">Bank statements (CSV/XLSX/PDF), invoices, receipts.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <div className="font-medium text-lg">Tips</div>
            <ul className="text-sm text-muted-foreground mt-2 list-disc pl-4">
              <li>Prefer CSV/XLSX for best parsing</li>
              <li>Ensure date and amount columns are visible</li>
              <li>Avoid scanned PDFs—text PDFs parse more reliably</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-white shadow animate-fade-in">
            <div className="font-medium text-lg">CSV/XLSX uploads</div>
            <p className="text-sm text-muted-foreground mt-2">Parse best for detailed categorization.</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-white shadow animate-fade-in">
            <div className="font-medium text-lg">Use tags</div>
            <p className="text-sm text-muted-foreground mt-2">Group subscriptions and recurring payments.</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-white shadow animate-fade-in">
            <div className="font-medium text-lg">Export summaries</div>
            <p className="text-sm text-muted-foreground mt-2">For HRA or reimbursements.</p>
          </div>
        </section>

        <section className="mt-8">
          <div className="rounded-2xl p-8 bg-primary text-primary-foreground flex items-center justify-between gap-6">
            <div>
              <div className="text-lg font-semibold">Ready to analyze?</div>
              <div className="text-sm text-primary-foreground/90 mt-1">Upload your statement and get started.</div>
            </div>
            <div>
              <Button asChild className="bg-white text-primary px-6 py-2 rounded-md shadow">
                <Link href="/statements">Upload now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
