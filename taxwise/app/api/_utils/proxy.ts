const getBaseUrl = () => {
  // Prefer server-side env var; fallback to NEXT_PUBLIC for preview; default localhost:8000
  return process.env.FIN_API_BASE_URL || process.env.NEXT_PUBLIC_FIN_API_BASE_URL || "http://localhost:8000"
}
// test
type ForwardInit = {
  method: string
  headers: Headers
  body?: BodyInit | null
}

export async function forwardJson(req: Request, path: string) {
  const url = `${getBaseUrl()}${path}`
  const raw = await req.text()
  const init: ForwardInit = {
    method: req.method,
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    body: raw || null,
  }
  const res = await fetch(url, init as RequestInit)
  return res
}

export async function forwardFormUrlEncoded(req: Request, path: string) {
  const url = `${getBaseUrl()}${path}`
  const raw = await req.text()
  const init: ForwardInit = {
    method: req.method,
    headers: new Headers({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: raw || null,
  }
  const res = await fetch(url, init as RequestInit)
  return res
}

export async function forwardMultipart(req: Request, path: string) {
  const url = `${getBaseUrl()}${path}`
  const form = await req.formData()
  const init: ForwardInit = {
    method: req.method,
    // Do NOT set content-type so boundary is set automatically
    headers: new Headers(),
    body: form as unknown as BodyInit,
  }
  const res = await fetch(url, init as RequestInit)
  return res
}

export async function forwardGet(_req: Request, path: string) {
  const url = `${getBaseUrl()}${path}`
  const res = await fetch(url, { method: "GET", cache: "no-store" })
  return res
}
