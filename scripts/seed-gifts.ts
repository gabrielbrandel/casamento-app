import { replaceAllGifts } from "@/lib/server-db"
import gifts from "@/data/gifts"

async function seed() {
    console.log("🌱 Iniciando seed de presentes...")

    await replaceAllGifts(gifts)

    console.log("✅ Seed finalizado com sucesso")
    process.exit(0)
}

seed().catch((err) => {
    console.error("❌ Erro no seed", err)
    process.exit(1)
})