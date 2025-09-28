"use client"

import Link from "next/link"

export function LandingHero() {
  return (
    <section className="py-16 md:py-24" style={{ background: "var(--brand-bg)", color: "var(--brand-fg)" }}>
      <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-semibold text-balance" style={{ color: "var(--brand-primary)" }}>
            Optimize Taxes, Decode Transactions, and Get AI-Driven Financial Advice
          </h1>
          <p className="mt-4 text-base md:text-lg text-pretty" style={{ color: "var(--brand-muted)" }}>
            Built for India. Upload your statements, analyze old vs new regime tax, improve your CIBIL score, and ask
            personalized questions. All in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/statements"
              className="px-5 py-2.5 text-sm font-medium"
              style={{
                background: "var(--brand-primary)",
                color: "var(--brand-on-primary)",
                borderRadius: "var(--brand-radius)",
              }}
            >
              Analyze Statements
            </Link>
            <Link
              href="/tax"
              className="px-5 py-2.5 text-sm font-medium border"
              style={{
                borderColor: "color-mix(in srgb, var(--brand-primary) 30%, transparent)",
                color: "var(--brand-primary)",
                borderRadius: "var(--brand-radius)",
              }}
            >
              Compare Tax Regimes
            </Link>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--brand-muted)" }}>
            Privacy-first: Files are processed server-side and not stored beyond analysis.
          </p>
        </div>
        <div className="rounded-lg p-6" style={{ background: "color-mix(in srgb, var(--brand-primary) 6%, white)" }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md p-4" style={{ background: "white", border: "1px solid rgba(11,60,93,0.12)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
                Old vs New
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--brand-muted)" }}>
                Tax comparison in seconds
              </p>
            </div>
            <div className="rounded-md p-4" style={{ background: "white", border: "1px solid rgba(11,60,93,0.12)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
                CIBIL Insights
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--brand-muted)" }}>
                Actionable improvement tips
              </p>
            </div>
            <div className="rounded-md p-4" style={{ background: "white", border: "1px solid rgba(11,60,93,0.12)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
                Categories
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--brand-muted)" }}>
                EMI, SIP, Food, etc.
              </p>
            </div>
            <div className="rounded-md p-4" style={{ background: "white", border: "1px solid rgba(11,60,93,0.12)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>
                AI Advisor
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--brand-muted)" }}>
                Personalized Q&A
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingFeatures() {
  const features = [
    {
      title: "Statement Intelligence",
      desc: "Upload CSV/Excel/PDF bank or card statements and get categorized transactions, totals, and recurring insights.",
    },
    {
      title: "Tax Optimization",
      desc: "Compare old vs new regime, see deductions under 80C/80D/24b, and get recommendations.",
    },
    {
      title: "CIBIL Improvement",
      desc: "Upload your CIBIL report to receive targeted actions to improve your credit profile.",
    },
    {
      title: "AI Chat Advisor",
      desc: "Ask questions in natural language and get reliable, cited answers for Indian finance.",
    },
  ]
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "var(--brand-primary)" }}>
          Everything you need for Indian personal finance
        </h2>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg p-6"
              style={{ background: "white", border: "1px solid rgba(11,60,93,0.12)" }}
            >
              <h3 className="text-lg font-medium" style={{ color: "var(--brand-primary)" }}>
                {f.title}
              </h3>
              <p className="text-sm mt-2" style={{ color: "var(--brand-muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LandingCTA() {
  return (
    <section className="py-16 md:py-24" style={{ background: "color-mix(in srgb, var(--brand-primary) 6%, white)" }}>
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl md:text-2xl font-semibold" style={{ color: "var(--brand-primary)" }}>
            Start optimizing your finances today
          </h3>
          <p className="text-sm mt-2" style={{ color: "var(--brand-muted)" }}>
            Upload statements, compare tax regimes, and ask the AI advisor—free during development.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/statements"
            className="px-5 py-2.5 text-sm font-medium"
            style={{
              background: "var(--brand-primary)",
              color: "var(--brand-on-primary)",
              borderRadius: "var(--brand-radius)",
            }}
          >
            Go to Statements
          </Link>
          <Link
            href="/chat"
            className="px-5 py-2.5 text-sm font-medium"
            style={{
              color: "var(--brand-primary)",
              border: "1px solid rgba(11,60,93,0.25)",
              borderRadius: "var(--brand-radius)",
            }}
          >
            Ask AI
          </Link>
        </div>
      </div>
    </section>
  )
}

export function LandingFAQ() {
  const faqs = [
    { q: "Which files are supported for statements?", a: "CSV, Excel (.xlsx/.xls), and PDF up to 10MB per file." },
    {
      q: "Do I need an API key?",
      a: "No auth for most endpoints. For AI chat, ensure your backend has GROQ_API_KEY set.",
    },
    {
      q: "Is my data stored?",
      a: "During development, files are processed for analysis only. You can modify persistence on your backend.",
    },
  ]
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h3 className="text-xl md:text-2xl font-semibold" style={{ color: "var(--brand-primary)" }}>
          Frequently asked questions
        </h3>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-lg p-6"
              style={{ background: "white", border: "1px solid rgba(11,60,93,0.12)" }}
            >
              <p className="font-medium" style={{ color: "var(--brand-primary)" }}>
                {f.q}
              </p>
              <p className="text-sm mt-2" style={{ color: "var(--brand-muted)" }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
