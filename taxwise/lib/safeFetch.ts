// Centralized safeFetch helper: checks status, content-type, 204 handling,
// and falls back to text parse with informative errors. Reuse across the app.
export async function safeFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init)

  if (res.status === 204) return null

  const contentType = (res.headers.get("content-type") || "").toLowerCase()

  let data: any = null

  if (contentType.includes("application/json") || contentType.includes("application/ld+json")) {
    try {
      data = await res.json()
    } catch (err) {
      const text = await res.text()
      throw new Error(`Failed to parse JSON response from ${typeof input === 'string' ? input : String(input)}: ${String(err)} - response snippet: ${text.slice(0, 200)}`)
    }
  } else {
    // Not JSON according to header — attempt to parse text as JSON as a best-effort,
    // but return text when parsing fails.
    const text = await res.text()
    try {
      data = JSON.parse(text)
    } catch (_err) {
      data = text
    }
  }

  if (!res.ok) {
    // Try to surface useful message fields
    const detail = (data && (data.detail || data.message)) || JSON.stringify(data)
    throw new Error(`Request failed ${res.status} ${res.statusText}: ${detail}`)
  }

  return data
}

export const swrFetcher = (url: string) => safeFetch(url)
