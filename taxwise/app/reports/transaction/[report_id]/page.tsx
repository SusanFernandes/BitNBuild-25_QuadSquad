"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { SiteHeader } from "@/components/site-header"
import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"
import { ArrowLeft } from "lucide-react"

type Transaction = {
  date: string
  description: string
  amount: number
  category?: string
}

type ReportData = {
  id: string
  transactions: Transaction[]
  summary: {
    total_transactions: number
    total_income: number
    total_expenses: number
    categories: Record<string, number>
    recurring_count: number
    date_range: { start: string; end: string }
  }
  filename: string
  created_date: string
}

export default function TransactionReportPage() {
  const params = useParams()
  const reportId = params.report_id as string
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReport = async () => {
      try {
        const res = await fetch(`/api/reports/transaction/${reportId}`)
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

  const categoryData = Object.entries(report.summary.categories || {}).map(([k, v]) => ({ name: k, value: v }))

  const incomeExpenseData = [
    { name: "Income", value: report.summary.total_income || 0 },
    { name: "Expenses", value: Math.abs(report.summary.total_expenses || 0) },
  ]

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
              <h1 className="text-2xl font-semibold">Transaction Report</h1>
              <p className="text-muted-foreground">Analysis from {report.filename}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Transactions</CardTitle>
                  <CardDescription>Date range</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="text-2xl font-semibold">{report.summary.total_transactions.toLocaleString()}</div>
                  <div className="text-muted-foreground mt-1">
                    {new Date(report.summary.date_range.start).toLocaleDateString()} –{" "}
                    {new Date(report.summary.date_range.end).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Income</CardTitle>
                  <CardDescription>All sources</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(report.summary.total_income).toLocaleString()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Expenses</CardTitle>
                  <CardDescription>Across categories</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(Math.abs(report.summary.total_expenses)).toLocaleString()}
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spending by Category</CardTitle>
                  <CardDescription>Distribution of transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      income: { label: "income", color: "var(--color-chart-2)" },
                      expenses: { label: "expenses", color: "var(--color-chart-1)" },
                    }}
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`oklch(${65 + (index % 3) * 8}% 0.18 ${40 + ((index * 30) % 360)})`}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Income vs Expenses</CardTitle>
                  <CardDescription>Totals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeExpenseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Legend />
                        <Bar dataKey="value" name="Amount (₹)" fill="oklch(60% 0.18 260)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Transactions</CardTitle>
                <CardDescription>{report.transactions.length} transactions found</CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.transactions.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell className="text-right">{Math.round(t.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.category || "uncategorized"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </BrandThemeWrapper>
  )
}