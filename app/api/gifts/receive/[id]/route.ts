import { NextResponse } from "next/server"
import { markReceived } from "@/lib/server-db"

export const runtime = "nodejs"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { received } = body
  const res = await markReceived(params.id, Boolean(received))
  return NextResponse.json(res)
}
