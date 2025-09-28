import Image from "next/image"
import Link from "next/link"
import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AccentIconRow, OutlineCard } from "@/components/pastel-accents"
import AnimatedText from "@/components/animated-text"

export default function LandingPage() {
  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="min-h-dvh">
        {/* Hero */}
        <section aria-labelledby="hero" className="border-b border-border">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 md:py-16 grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h1 id="hero" className="text-pretty text-3xl md:text-5xl font-semibold tracking-tight">
                Simplify taxes, analyze spending, and improve your CIBIL—fast.
              </h1>
              <div className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
                <AnimatedText words={["taxes made simple", "smarter spending", "a healthier CIBIL"]} />
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Upload statements, compare Old vs New regimes, and ask finance questions in plain language. Built for
                India with an AI-powered backend.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-primary text-primary-foreground">
                  <Link href="/statements">Upload Statements</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/tax">Analyze Tax</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/chat">Ask AI</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/reports">View Reports</Link>
                </Button>
              </div>
            </div>
            <Card className="md:h-full">
              <CardHeader>
                <CardTitle>Why TaxWise?</CardTitle>
                <CardDescription>Purpose-built for Indian personal finance.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Image src="/secure-shield-icon.jpg" alt="Security" width={40} height={40} />
                  <div>
                    <div className="font-medium text-foreground">Actionable Insights</div>
                    <p>Clear recommendations on taxes, investments, and credit health.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Image src="/india-rupee-icon.jpg" alt="Rupee" width={40} height={40} />
                  <div>
                    <div className="font-medium text-foreground">Made for India</div>
                    <p>Understands sections 80C/80D/24b/80G, CIBIL, and local categories.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Image src="/ai-assistant-icon.png" alt="AI" width={40} height={40} />
                  <div>
                    <div className="font-medium text-foreground">AI-Powered</div>
                    <p>Personalized advice with sources and confidence levels.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="features" className="text-xl md:text-2xl font-semibold mb-6">
            What you can do
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Smart Ingestion</CardTitle>
                <CardDescription>CSV, Excel, and PDF supported.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Auto-categorize income, EMIs, SIPs, rent, utilities, and more.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tax Optimization</CardTitle>
                <CardDescription>Old vs New regime, 80C/80D/24b/80G.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Get actionable steps to legally reduce tax.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CIBIL Advisor</CardTitle>
                <CardDescription>PDF report insights.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Track utilization, payment history, and score improvement tips.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-8">
            <h2 id="how-it-works" className="text-pretty text-xl md:text-2xl font-semibold">
              How it works
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">1) Upload</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Add bank statements (CSV, XLSX, PDF), CIBIL PDFs, or receipts.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2) Categorize</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  AI auto-tags income, EMIs, investments, utilities, and more.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3) Analyze</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Compare Old vs New regimes, deductions, and credit health.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">4) Take Action</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Follow step-by-step recommendations tailored to you.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Deep features */}
        <section aria-labelledby="deep-features" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="deep-features" className="text-pretty text-xl md:text-2xl font-semibold mb-6">
            Deeper capabilities
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bank-grade parsing</CardTitle>
                <CardDescription>Structured insights</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Robust parsing across banks and formats with smart anomaly checks.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Section-aware tax engine</CardTitle>
                <CardDescription>India-focused</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Understands sections 80C, 80D, 24b, 80G, HRA, NPS, and more.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CIBIL drilldowns</CardTitle>
                <CardDescription>Score improvement</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Utilization, delinquency, and age-of-credit insights with tips.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goal-based guidance</CardTitle>
                <CardDescription>Personalized</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Choose goals like “buy a home” or “reduce tax” for tailored steps.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Explain like I’m 5</CardTitle>
                <CardDescription>Clarity first</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Plain-language answers with examples and links to sources.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Privacy by design</CardTitle>
                <CardDescription>Local-first</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Scoped APIs and secure upload routes keep your data protected.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Regime comparison */}
        <section aria-labelledby="regime-comparison" className="border-y border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-6">
            <h2 id="regime-comparison" className="text-pretty text-xl md:text-2xl font-semibold">
              Old vs New regime overview
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Old Regime</CardTitle>
                  <CardDescription>For deduction-heavy profiles</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground grid gap-2">
                  <div>• Uses slabs with multiple deductions (80C, 80D, HRA, etc.)</div>
                  <div>• Better for higher deduction taxpayers</div>
                  <div>• Requires proof and documentation</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">New Regime</CardTitle>
                  <CardDescription>Simpler slabs, fewer deductions</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground grid gap-2">
                  <div>• Lower rates with limited deductions</div>
                  <div>• Great for low-deduction taxpayers</div>
                  <div>• Quick and less paperwork</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section aria-labelledby="testimonials" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="testimonials" className="text-pretty text-xl md:text-2xl font-semibold mb-6">
            Users love TaxWise
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                “I saved hours comparing tax regimes. The recommendations were crystal clear.”
                <div className="mt-3 text-foreground font-medium">— Aditi, Bengaluru</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                “Upload, analyze, done. The CIBIL tips raised my score in 2 months.”
                <div className="mt-3 text-foreground font-medium">— Rohan, Pune</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                “Finally a tool that understands Indian tax sections without jargon.”
                <div className="mt-3 text-foreground font-medium">— Kavya, Delhi</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="faq" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="privacy">
              <AccordionTrigger>How do you handle my data?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Data is processed via secure routes and never shared. You can delete uploads at any time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="formats">
              <AccordionTrigger>Which formats are supported?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Bank statements (CSV/XLSX/PDF), receipts (PDF), and CIBIL PDFs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="accuracy">
              <AccordionTrigger>How accurate are the analyses?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                We combine rules-based logic with AI validation, and show reasoning for key steps.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Pastel Accents */}
        <section
          aria-labelledby="pastel-accents"
          className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12"
        >
          <h2 id="pastel-accents" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Highlights
          </h2>
          <AccentIconRow />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">
                Soft pink outline for friendly emphasis on helpful info.
              </div>
            </OutlineCard>
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">Gentle green outline for tips and success states.</div>
            </OutlineCard>
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">
                Use for small callouts and visual rhythm on long pages.
              </div>
            </OutlineCard>
          </div>
        </section>

        {/* Quick CTAs */}
        <section aria-labelledby="get-started" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 pb-16">
          <h2 id="get-started" className="text-xl md:text-2xl font-semibold mb-4">
            Get started now
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button asChild className="bg-primary text-primary-foreground">
              <Link href="/statements">Statements</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/tax">Tax Analysis</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cibil">CIBIL Insights</Link>
            </Button>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="final-cta" className="border-t border-border bg-primary text-primary-foreground">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-10 grid gap-3">
            <h2 id="final-cta" className="text-pretty text-2xl font-semibold">
              Start optimizing your finances today
            </h2>
            <p className="text-sm opacity-90">Upload statements, compare regimes, and get personalized tips.</p>
            <div>
              <Button asChild variant="secondary">
                <Link href="/statements">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
            <p>&copy; {new Date().getFullYear()} TaxWise. All rights reserved.</p>
            <p>
              API Base:{" "}
              <code className="font-mono">{process.env.NEXT_PUBLIC_FIN_API_BASE_URL || "http://localhost:8000"}</code>
            </p>
          </div>
        </footer>
      </main>
    </BrandThemeWrapper>
  )
}
