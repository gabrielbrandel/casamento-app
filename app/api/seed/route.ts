import { NextResponse } from "next/server"
import { replaceAllGifts } from "@/lib/server-db"
import { initialGifts } from "@/data/gifts"

export async function POST() {
  const res = await replaceAllGifts(initialGifts)
  return NextResponse.json({ ok: true, count: res.length })
}
