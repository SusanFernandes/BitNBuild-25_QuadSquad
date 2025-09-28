"use client"

import useSWR from "swr"
import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AccentIconRow, OutlineCard } from "@/components/pastel-accents"

import { swrFetcher } from "@/lib/safeFetch"

// Use centralized swrFetcher which wraps fetch with robust parsing and error messages
const fetcher = swrFetcher

export default function Page() {
  const { data, error, isLoading } = useSWR("/api/health", fetcher)

  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8 grid gap-6">
        <h1 className="text-2xl font-semibold">Health</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">API Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {isLoading && "Checking..."}
            {error && <span className="text-destructive">Failed to load health</span>}
            {data && (
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${data.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">Status: {data.status || "unknown"}</span>
                </div>
                {data.timestamp && <div>Timestamp: {new Date(data.timestamp).toLocaleString()}</div>}
                
                <div className="grid gap-2">
                  <h4 className="font-medium">Services:</h4>
                  <div className="grid gap-1 pl-4">
                    {Object.entries(data.services || {}).map(([service, available]) => (
                      <div key={service} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="capitalize">{service.replace('_', ' ')}: {available ? 'Available' : 'Unavailable'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endpoints overview */}
        <section aria-labelledby="endpoints" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-6">
            <h2 id="endpoints" className="text-pretty text-xl md:text-2xl font-semibold">
              Endpoints
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">/api/health</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Pings backend health and version.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">/api/upload/statements</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Accepts CSV/XLSX/PDF for parsing.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">/api/analyze/tax</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Runs regime comparison & deductions.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section
          aria-labelledby="troubleshooting"
          className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12"
        >
          <h2 id="troubleshooting" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Troubleshooting
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                If health fails, verify FIN_API_BASE_URL or NEXT_PUBLIC_FIN_API_BASE_URL in Project Settings.
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Check backend CORS and route paths match the proxies.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pastel diagnostics */}
        <section
          aria-labelledby="health-accents"
          className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12"
        >
          <h2 id="health-accents" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Pastel diagnostics
          </h2>
          <AccentIconRow />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">Health checks pass when backend is reachable.</div>
            </OutlineCard>
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">Set FIN_API_BASE_URL if you’re not on localhost.</div>
            </OutlineCard>
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">Use SWR for lightweight caching and revalidation.</div>
            </OutlineCard>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="health-faq" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
            <h2 id="health-faq" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
              Health FAQ
            </h2>
            <Accordion type="single" collapsible>
              <AccordionItem value="cache">
                <AccordionTrigger>Is health cached?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Client uses SWR for lightweight caching and revalidation.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="latency">
                <AccordionTrigger>Why is latency high?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  It may reflect cold starts or network location—try again and monitor patterns.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
