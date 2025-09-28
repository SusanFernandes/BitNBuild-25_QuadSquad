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

type TaxReportData = {
  id: string
  annual_income: number
  current_investments: Record<string, number>
  old_regime_tax: number
  new_regime_tax: number
  recommendations: string[]
  deductions_available: Record<string, number>
  created_date: string
}

export default function TaxReportPage() {
  const params = useParams()
  const reportId = params.report_id as string
  const [report, setReport] = useState<TaxReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await fetch(`/api/reports/tax/${reportId}`)
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

  const betterRegime = report.old_regime_tax < report.new_regime_tax ? "Old Regime" : "New Regime"
  const savings = Math.abs(report.old_regime_tax - report.new_regime_tax)

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
              <h1 className="text-2xl font-semibold">Tax Analysis Report</h1>
              <p className="text-muted-foreground">Analysis for ₹{report.annual_income.toLocaleString()} annual income</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Tax Comparison */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Annual Income</CardTitle>
                  <CardDescription>Gross income</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {report.annual_income.toLocaleString()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Old Regime Tax</CardTitle>
                  <CardDescription>With deductions</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(report.old_regime_tax).toLocaleString()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">New Regime Tax</CardTitle>
                  <CardDescription>Simplified rates</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(report.new_regime_tax).toLocaleString()}
                </CardContent>
              </Card>
            </div>

            {/* Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Regime</CardTitle>
                <CardDescription>Based on your income and deductions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {betterRegime}
                  </Badge>
                  <div>
                    <p className="font-medium">
                      Save ₹{savings.toLocaleString()} by choosing {betterRegime.toLowerCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Effective rate: {((Math.min(report.old_regime_tax, report.new_regime_tax) / report.annual_income) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Investments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Investments</CardTitle>
                <CardDescription>Your existing tax-saving investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {Object.entries(report.current_investments).map(([section, amount]) => (
                    <div key={section} className="flex items-center justify-between">
                      <span className="font-medium">{section}</span>
                      <span>₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {Object.keys(report.current_investments).length === 0 && (
                    <p className="text-muted-foreground">No investments recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Deductions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Available Deductions</CardTitle>
                <CardDescription>Additional tax-saving opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {Object.entries(report.deductions_available).map(([section, amount]) => (
                    <div key={section} className="flex items-center justify-between">
                      <span className="font-medium">{section}</span>
                      <span className="text-green-600">₹{amount.toLocaleString()} available</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
                <CardDescription>Actionable steps to optimize your tax</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  {report.recommendations?.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </BrandThemeWrapper>
  )
}