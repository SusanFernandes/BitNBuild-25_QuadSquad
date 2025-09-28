"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Transaction = {
  date: string
  description: string
  amount: number
  category?: string
}

type Summary = {
  total_transactions: number
  total_income: number
  total_expenses: number
  categories: Record<string, number>
  recurring_count: number
  date_range: { start: string; end: string }
}

export default function StatementsUploader() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!files || files.length === 0) {
      setError("Please select at least one file.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((f) => formData.append("files", f))
      const res = await fetch("/api/upload/statements", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.detail || "Upload failed")
      }
      setTransactions(data.transactions || [])
      setSummary(data.summary || null)
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  const categoryData = summary ? Object.entries(summary.categories || {}).map(([k, v]) => ({ name: k, value: v })) : []

  const incomeExpenseData = summary
    ? [
        { name: "Income", value: summary.total_income || 0 },
        { name: "Expenses", value: Math.abs(summary.total_expenses || 0) },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Statements</CardTitle>
        <CardDescription>CSV, Excel (.xlsx/.xls), and PDF are supported.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="files">Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={(e) => setFiles(e.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              Max 10MB per file. Required columns are flexible: Date, Description, Amount.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Analyzing…" : "Analyze Statements"}
            </Button>
            {error && (
              <span className="text-destructive text-sm" role="alert">
                {error}
              </span>
            )}
          </div>
        </form>

        {summary && (
          <>
            <Separator />
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Transactions</CardTitle>
                  <CardDescription>Date range</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="text-2xl font-semibold">{summary.total_transactions.toLocaleString()}</div>
                  <div className="text-muted-foreground mt-1">
                    {new Date(summary.date_range.start).toLocaleDateString()} –{" "}
                    {new Date(summary.date_range.end).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Income</CardTitle>
                  <CardDescription>All sources</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(summary.total_income).toLocaleString()}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Expenses</CardTitle>
                  <CardDescription>Across categories</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ₹ {Math.round(Math.abs(summary.total_expenses)).toLocaleString()}
                </CardContent>
              </Card>
            </div>

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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sample Transactions</CardTitle>
                <CardDescription>First 10 records</CardDescription>
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
                    {transactions.slice(0, 10).map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell className="text-right">{Math.round(t.amount).toLocaleString()}</TableCell>
                        <TableCell>{t.category || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  )
}
