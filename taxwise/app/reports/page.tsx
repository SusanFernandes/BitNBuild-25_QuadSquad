"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SiteHeader } from "@/components/site-header"
import { BrandThemeWrapper } from "@/components/brand-theme-wrapper"

type Report = {
  id: string
  type: string
  created_date: string
  filename?: string
  summary: {
    total_transactions?: number
    total_income?: number
    total_expenses?: number
    annual_income?: number
    old_regime_tax?: number
    new_regime_tax?: number
    current_score?: number
    improvement_potential?: number
    question?: string
    answer?: string
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const loadReports = async (loadMore = false) => {
    try {
      const offset = loadMore ? reports.length : 0
      const url = `/api/reports/list?limit=20&offset=${offset}${filter && filter !== 'all' ? `&report_type=${filter}` : ''}`
      const res = await fetch(url)
      const contentType = res.headers.get("content-type") || ""
      let data: any = null

      if (res.status === 204) data = null
      else if (contentType.includes("application/json")) {
        try {
          data = await res.json()
        } catch (err) {
          throw new Error("Received invalid JSON from server")
        }
      } else {
        const text = await res.text()
        if (!text) throw new Error("Empty response from server")
        try {
          data = JSON.parse(text)
        } catch (err) {
          throw new Error("Server returned non-JSON response")
        }
      }

      if (!res.ok) throw new Error(data?.detail || `Failed to load reports (status ${res.status})`)

      if (loadMore) {
        setReports(prev => [...prev, ...data.reports])
      } else {
        setReports(data.reports)
      }
      setHasMore(data.has_more)
      setPage(loadMore ? page + 1 : 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [filter])

  const handleDelete = async (reportType: string, reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return

    try {
      const res = await fetch(`/api/reports/${reportType}/${reportId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error("Failed to delete report")

      // Reload reports
      loadReports()
    } catch (err: any) {
      alert(`Error deleting report: ${err.message}`)
    }
  }

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-blue-100 text-blue-800'
      case 'tax': return 'bg-green-100 text-green-800'
      case 'cibil': return 'bg-purple-100 text-purple-800'
      case 'chat': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatSummary = (report: Report) => {
    switch (report.type) {
      case 'transaction':
        return `${report.summary.total_transactions || 0} transactions, ₹${(report.summary.total_income || 0).toLocaleString()} income`
      case 'tax':
        return `₹${(report.summary.annual_income || 0).toLocaleString()} income, Old: ₹${(report.summary.old_regime_tax || 0).toLocaleString()}, New: ₹${(report.summary.new_regime_tax || 0).toLocaleString()}`
      case 'cibil':
        return `Score: ${report.summary.current_score || 'N/A'}, Potential: ${report.summary.improvement_potential || 0}%`
      case 'chat':
        return report.summary.question ? report.summary.question.substring(0, 50) + '...' : 'Chat query'
      default:
        return 'Report details'
    }
  }

  return (
    <BrandThemeWrapper>
      <SiteHeader />
      <main className="min-h-dvh">
        <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Reports</h1>
              <p className="text-muted-foreground">View and manage your saved analyses</p>
            </div>
            <div className="flex gap-3">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="transaction">Transactions</SelectItem>
                  <SelectItem value="tax">Tax Analysis</SelectItem>
                  <SelectItem value="cibil">CIBIL</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => loadReports()} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          <div>
            <div className="mb-4 text-sm text-muted-foreground">{reports.length} report{reports.length !== 1 ? 's' : ''} found</div>

            {loading && reports.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No reports found. Try uploading or running analyses.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => (
                  <article key={report.id} className="rounded-lg border p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getReportTypeColor(report.type)}>{report.type}</Badge>
                          <div className="text-xs text-muted-foreground">{new Date(report.created_date).toLocaleDateString()}</div>
                        </div>
                        <h3 className="mt-3 font-medium text-lg">{report.filename || (report.type + ' report')}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{formatSummary(report)}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-muted-foreground">{report.summary && report.summary.annual_income ? `₹${(report.summary.annual_income||0).toLocaleString()}` : ''}</div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/reports/${report.type}/${report.id}`}>Open</Link>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(report.type, report.id)} className="text-destructive">Delete</Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button onClick={() => loadReports(true)} disabled={loading}>Load More</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </BrandThemeWrapper>
  )
}