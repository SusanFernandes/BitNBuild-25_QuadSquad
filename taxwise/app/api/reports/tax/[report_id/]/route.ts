import { NextResponse } from "next/server"
import { forwardGet } from "../../../../_utils/proxy"

export async function GET(request: Request, { params }: { params: { report_id: string } }) {
  try {
    const upstream = await forwardGet(request, `/reports/tax/${params.report_id}`)
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (e: any) {
    return NextResponse.json({ detail: "Upstream error" }, { status: 500 })
  }
}