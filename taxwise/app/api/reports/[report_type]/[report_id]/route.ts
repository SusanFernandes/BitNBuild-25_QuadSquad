import { NextResponse } from "next/server"
import { forwardDelete } from "../../../_utils/proxy"

export async function DELETE(request: Request, { params }: { params: { report_type: string; report_id: string } }) {
  try {
    const upstream = await forwardDelete(request, `/reports/${params.report_type}/${params.report_id}`)
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (e: any) {
    return NextResponse.json({ detail: "Upstream error" }, { status: 500 })
  }
}