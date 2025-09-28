import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { SiteHeader } from "@/components/site-header"
import KnowledgeUpdater from "@/components/knowledge-updater"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Page() {
  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-12 grid gap-10">
        <section className="grid md:grid-cols-2 gap-8 items-center animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Knowledge base and document indexing</h1>
            <p className="text-lg text-muted-foreground mt-2">Upload policies, spreadsheets, and SOPs to enable focused Q&A and searchable references.</p>

            <div className="mt-4">
              <Button asChild className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
                <Link href="/health">Check API health</Link>
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card shadow animate-fade-in">
            <KnowledgeUpdater />
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-2xl bg-card shadow">
            <div className="font-medium">Policies</div>
            <p className="text-sm text-muted-foreground mt-2">Upload tax circulars and policy PDFs for quick Q&A.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow">
            <div className="font-medium">Spreadsheets</div>
            <p className="text-sm text-muted-foreground mt-2">Index reference tables and rate slabs for lookup.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card shadow">
            <div className="font-medium">Docs & notes</div>
            <p className="text-sm text-muted-foreground mt-2">Turn scattered notes into indexed answers for faster responses.</p>
          </div>
        </section>
      </main>
    </BrandThemeWrapper>
  )
}
