import { NextResponse } from "next/server"
import { getAllGifts, getDbUrlSource } from "@/lib/server-db"

export const runtime = "nodejs"

export async function GET() {
  try {
    const source = getDbUrlSource()
    const gifts = await getAllGifts()
    return NextResponse.json({ ok: true, count: gifts.length, source })
  } catch (err: any) {
    const source = getDbUrlSource()
    const msg = typeof err === "string" ? err : err?.message || JSON.stringify(err)
    return NextResponse.json({ ok: false, error: msg, source }, { status: 500 })
  }
}
