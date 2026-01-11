import { NextResponse } from "next/server"
import { getAllGifts, upsertGift, replaceAllGifts } from "@/lib/server-db"

export async function GET() {
  const gifts = await getAllGifts()
  return NextResponse.json(gifts)
}

export async function POST(request: Request) {
  const body = await request.json()
  if (Array.isArray(body)) {
    const res = await replaceAllGifts(body)
    return NextResponse.json(res)
  }
  const gift = await upsertGift(body)
  return NextResponse.json(gift)
}
