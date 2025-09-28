import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import StatementsUploader from "@/components/statements-uploader"
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
          <h1 className="text-2xl font-semibold">Statements</h1>
          <Button asChild variant="outline">
            <Link href="/reports?report_type=transaction">View Transaction Reports</Link>
          </Button>
        </div>
        <StatementsUploader />

        {/* Overview */}
        <section aria-labelledby="statements-overview" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-10 grid gap-6">
            <h2 id="statements-overview" className="text-pretty text-xl md:text-2xl font-semibold">
              Make sense of your money
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Auto-categorized</CardTitle>
                  <CardDescription>Spend & income</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  EMIs, SIPs, rent, utilities, refunds—tagged automatically.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Trends</CardTitle>
                  <CardDescription>Month-over-month</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Spot patterns and outliers to take action faster.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export</CardTitle>
                  <CardDescription>Share or save</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Download CSVs or summaries for your records.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Supported formats */}
        <section
          aria-labelledby="supported-formats"
          className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12"
        >
          <h2 id="supported-formats" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Supported formats
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bank Statements</CardTitle>
                <CardDescription>CSV / XLSX / PDF</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                HDFC, ICICI, SBI, Axis, Kotak, and more.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Other Docs</CardTitle>
                <CardDescription>Invoices & receipts</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Utility bills, SIP confirmations, and rent receipts.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tips */}
        <section aria-labelledby="upload-tips" className="border-y border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-6">
            <h2 id="upload-tips" className="text-pretty text-xl md:text-2xl font-semibold">
              Upload tips
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Prefer CSV/XLSX when possible for best parsing.
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Ensure date and amount columns are visible.
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Avoid scanned PDFs—text PDFs parse more reliably.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pastel highlights */}
        <section
          aria-labelledby="statements-accents"
          className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12"
        >
          <h2 id="statements-accents" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Pastel highlights
          </h2>
          <AccentIconRow />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">
                CSV/XLSX uploads parse best for detailed categorization.
              </div>
            </OutlineCard>
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">
                Use tags to group subscriptions and recurring payments.
              </div>
            </OutlineCard>
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">Export monthly summaries for HRA or reimbursements.</div>
            </OutlineCard>
          </div>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="statements-faq"
          className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12"
        >
          <h2 id="statements-faq" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            FAQ
          </h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="limits">
              <AccordionTrigger>Is there a file size limit?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Large files are supported; very large PDFs may take longer to parse.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Uploads go through secure routes and can be deleted anytime.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-6">
            <Button>Upload another file</Button>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
