"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SiteHeader } from "@/components/site-header"
import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { ArrowLeft } from "lucide-react"

type CibilReportData = {
  id: string
  current_score: number
  factors: Record<string, any>
  recommendations: string[]
  improvement_potential: number
  filename: string
  created_date: string
}

export default function CibilReportPage() {
  const params = useParams()
  const reportId = params.report_id as string
  const [report, setReport] = useState<CibilReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await fetch(`/api/reports/cibil/${reportId}`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.detail || "Failed to load report")

        setReport(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (reportId) loadReport()
  }, [reportId])

  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-600"
    if (score >= 650) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 750) return "Excellent"
    if (score >= 650) return "Good"
    if (score >= 550) return "Fair"
    return "Poor"
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
              <h1 className="text-2xl font-semibold">CIBIL Report Analysis</h1>
              <p className="text-muted-foreground">Analysis from {report.filename}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Score Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current CIBIL Score</CardTitle>
                  <CardDescription>Credit health indicator</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${getScoreColor(report.current_score)}`}>
                    {report.current_score}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {getScoreLabel(report.current_score)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Credit Utilization</CardTitle>
                  <CardDescription>Percentage of available credit used</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {report.factors?.credit_utilization ?? "-"}%
                  </div>
                  <Progress
                    value={report.factors?.credit_utilization ?? 0}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Keep below 30% for optimal score
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Improvement Potential</CardTitle>
                  <CardDescription>Maximum possible score increase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-green-600">
                    +{report.improvement_potential}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    With recommended actions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credit Factors</CardTitle>
                <CardDescription>Key elements affecting your score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(report.factors || {}).map(([factor, value]) => (
                    <div key={factor} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">
                          {factor.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {String(value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
                <CardDescription>Actionable steps to improve your CIBIL score</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  {report.recommendations?.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Score Ranges Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CIBIL Score Ranges</CardTitle>
                <CardDescription>Understanding your score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-medium">750-900: Excellent</span>
                    <span className="text-sm text-muted-foreground">Best rates and terms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-600 font-medium">650-749: Good</span>
                    <span className="text-sm text-muted-foreground">Good rates available</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-medium">550-649: Fair</span>
                    <span className="text-sm text-muted-foreground">Average rates</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-medium">300-549: Poor</span>
                    <span className="text-sm text-muted-foreground">Limited options, higher rates</span>
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