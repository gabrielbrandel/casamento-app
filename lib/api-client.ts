export async function fetchGifts() {
  const res = await fetch("/api/gifts", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch gifts")
  return res.json()
}

export async function upsertGift(gift: any) {
  const res = await fetch("/api/gifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gift),
  })
  if (!res.ok) throw new Error("Failed to upsert gift")
  return res.json()
}

export async function replaceAllGifts(gifts: any[]) {
  const res = await fetch("/api/gifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(gifts),
  })
  if (!res.ok) throw new Error("Failed to replace gifts")
  return res.json()
}

export async function markReceivedApi(id: string, received: boolean) {
  const res = await fetch(`/api/gifts/receive/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ received }),
  })
  if (!res.ok) throw new Error("Failed to mark received")
  return res.json()
}
