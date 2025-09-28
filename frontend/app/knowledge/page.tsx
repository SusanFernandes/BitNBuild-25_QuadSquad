import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import KnowledgeUpdater from "@/components/knowledge-updater"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AccentIconRow, OutlineCard } from "@/components/pastel-accents"

export default function Page() {
  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8 grid gap-6">
        <h1 className="text-2xl font-semibold">Knowledge</h1>
        <KnowledgeUpdater />

        {/* What to upload */}
        <section aria-labelledby="knowledge-types" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-6">
            <h2 id="knowledge-types" className="text-pretty text-xl md:text-2xl font-semibold">
              Knowledge types
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Policies</CardTitle>
                  <CardDescription>Company or tax</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Upload PDFs for quick Q&A summaries.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spreadsheets</CardTitle>
                  <CardDescription>Reference tables</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Rates, slabs, and limits for fast lookup.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Docs & notes</CardTitle>
                  <CardDescription>Internal SOPs</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Turn scattered notes into indexed answers.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pastel callouts */}
        <section
          aria-labelledby="knowledge-accents"
          className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12"
        >
          <h2 id="knowledge-accents" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            Pastel callouts
          </h2>
          <AccentIconRow />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">Upload tax circulars for quick policy Q&A.</div>
            </OutlineCard>
            <OutlineCard accent="green">
              <div className="text-sm text-muted-foreground">Index spreadsheets to enable slab lookups.</div>
            </OutlineCard>
            <OutlineCard accent="pink">
              <div className="text-sm text-muted-foreground">Keep SOPs updated to avoid outdated answers.</div>
            </OutlineCard>
          </div>
        </section>

        {/* Indexing approach */}
        <section aria-labelledby="indexing" className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
          <h2 id="indexing" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
            How indexing works
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Documents are chunked, embedded, and stored with metadata for targeted retrieval.
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Freshness policies ensure recent uploads are prioritized in answers.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="knowledge-faq" className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12">
            <h2 id="knowledge-faq" className="text-pretty text-xl md:text-2xl font-semibold mb-4">
              Knowledge FAQ
            </h2>
            <Accordion type="single" collapsible>
              <AccordionItem value="limits">
                <AccordionTrigger>Are there limits?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Very large files are supported; processing time scales with size.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="privacy">
                <AccordionTrigger>Who can access my uploads?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Only you. Data remains private and deletable.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
