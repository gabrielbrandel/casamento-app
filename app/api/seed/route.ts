import { NextResponse } from "next/server"
import { replaceAllGifts } from "@/lib/server-db"
import { initialGifts } from "@/data/gifts"

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL ausente no ambiente do Vercel" },
        { status: 500 },
      )
    }

    const res = await replaceAllGifts(initialGifts)
    return NextResponse.json({ ok: true, count: res.length })
  } catch (err: any) {
    console.error("Seed failed", err)
    const serialized = typeof err === "string" ? err : err?.message || JSON.stringify(err)
    return NextResponse.json(
      { ok: false, error: serialized ?? "Erro ao executar seed" },
      { status: 500 },
    )
  }
}
