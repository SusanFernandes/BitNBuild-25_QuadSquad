"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { ArrowLeft } from "lucide-react"

type ChatReportData = {
  id: string
  question: string
  answer: string
  user_context: Record<string, any> | null
  sources_used: number
  confidence: string
  created_date: string
}

export default function ChatReportPage() {
  const params = useParams()
  const queryId = params.query_id as string
  const [report, setReport] = useState<ChatReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await fetch(`/api/reports/chat/${queryId}`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.detail || "Failed to load report")

        setReport(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (queryId) loadReport()
  }, [queryId])

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <BrandThemeWrapper>
        <SiteHeader />
        <main className="min-h-dvh flex items-center justify-center">
          <p>Loading report...</p>
        </main>
      </BrandThemeWrapper>
    )
  }

  if (error || !report) {
    return (
      <BrandThemeWrapper>
        <SiteHeader />
        <main className="min-h-dvh">
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-6">
              <Button asChild variant="outline" size="sm">
                <Link href="/reports">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Reports
                </Link>
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive">{error || "Report not found"}</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </BrandThemeWrapper>
    )
  }

  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="min-h-dvh">
        <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/reports">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Reports
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Chat Query Report</h1>
              <p className="text-muted-foreground">AI assistant conversation from {new Date(report.created_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Query Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Query Date</CardTitle>
                  <CardDescription>When the question was asked</CardDescription>
                </CardHeader>
                <CardContent className="text-lg font-semibold">
                  {new Date(report.created_date).toLocaleDateString()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sources Used</CardTitle>
                  <CardDescription>Knowledge base references</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {report.sources_used}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Confidence Level</CardTitle>
                  <CardDescription>AI response reliability</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className={getConfidenceColor(report.confidence)}>
                    {report.confidence}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* User Context */}
            {report.user_context && Object.keys(report.user_context).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Context</CardTitle>
                  <CardDescription>Information provided with the query</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {Object.entries(report.user_context).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Question</CardTitle>
                <CardDescription>The query asked to the AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{report.question}</p>
              </CardContent>
            </Card>

            {/* Answer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Response</CardTitle>
                <CardDescription>Answer provided by the TaxWise AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed">{report.answer}</div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Response Metadata</CardTitle>
                <CardDescription>Technical details about the AI response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="font-medium text-sm text-muted-foreground">SOURCES USED</div>
                    <div className="text-lg font-semibold">{report.sources_used}</div>
                    <div className="text-xs text-muted-foreground">
                      Number of knowledge base references consulted
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-muted-foreground">CONFIDENCE</div>
                    <Badge className={`${getConfidenceColor(report.confidence)} mt-1`}>
                      {report.confidence.toUpperCase()}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      AI's assessment of answer reliability
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </BrandThemeWrapper>
  )
}