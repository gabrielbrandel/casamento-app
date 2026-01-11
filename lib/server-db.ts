import fs from "fs"
import path from "path"

const LOCAL_DB = path.resolve(process.cwd(), "data", "local-db.json")

async function ensureLocalDb() {
  try {
    await fs.promises.access(LOCAL_DB)
  } catch {
    await fs.promises.mkdir(path.dirname(LOCAL_DB), { recursive: true })
    await fs.promises.writeFile(LOCAL_DB, JSON.stringify([]), "utf-8")
  }
}

function isPostgres() {
  return Boolean(process.env.DATABASE_URL)
}

let pgPool: any = null
async function getPgPool() {
  if (!pgPool) {
    const { Pool } = await import("pg")
      pgPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 1,
          ssl: { rejectUnauthorized: false },
      })

    // create table if not exists
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS gifts (
        id TEXT PRIMARY KEY,
        nome TEXT,
        categoria TEXT,
        precoEstimado TEXT,
        faixaPreco TEXT,
        imageUrl TEXT,
        ativo BOOLEAN,
        status TEXT,
        compradoPor JSONB
      );
    `)
  }
  return pgPool
}

export async function getAllGifts() {
  if (isPostgres()) {
    const pool = await getPgPool()
    const res = await pool.query("SELECT * FROM gifts ORDER BY nome")
    return res.rows.map((r: any) => ({
      ...r,
      compradoPor: r.compradopor || r.compradoPor || null,
    }))
  }

  await ensureLocalDb()
  const raw = await fs.promises.readFile(LOCAL_DB, "utf-8")
  return JSON.parse(raw)
}

export async function upsertGift(gift: any) {
  if (isPostgres()) {
    const pool = await getPgPool()
    const query = `
      INSERT INTO gifts(id, nome, categoria, precoEstimado, faixaPreco, imageUrl, ativo, status, compradoPor)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (id) DO UPDATE SET
        nome=EXCLUDED.nome,
        categoria=EXCLUDED.categoria,
        precoEstimado=EXCLUDED.precoEstimado,
        faixaPreco=EXCLUDED.faixaPreco,
        imageUrl=EXCLUDED.imageUrl,
        ativo=EXCLUDED.ativo,
        status=EXCLUDED.status,
        compradoPor=EXCLUDED.compradoPor;
    `
    await pool.query(query, [
      gift.id,
      gift.nome,
      gift.categoria,
      gift.precoEstimado,
      gift.faixaPreco,
      gift.imageUrl,
      gift.ativo,
      gift.status,
      gift.compradoPor ? JSON.stringify(gift.compradoPor) : null,
    ])
    return gift
  }

  await ensureLocalDb()
  const raw = await fs.promises.readFile(LOCAL_DB, "utf-8")
  const arr = JSON.parse(raw)
  const idx = arr.findIndex((g: any) => g.id === gift.id)
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...gift }
  } else {
    arr.push(gift)
  }
  await fs.promises.writeFile(LOCAL_DB, JSON.stringify(arr, null, 2), "utf-8")
  return gift
}

export async function markReceived(giftId: string, received: boolean) {
  if (isPostgres()) {
    const pool = await getPgPool()
    const res = await pool.query("SELECT compradoPor FROM gifts WHERE id = $1", [giftId])
    const comprado = res.rows[0]?.compradopor || res.rows[0]?.compradoPor || null
    const newComprado = comprado ? { ...comprado, recebidoConfirmado: received } : null
    await pool.query("UPDATE gifts SET compradoPor = $1 WHERE id = $2", [newComprado ? JSON.stringify(newComprado) : null, giftId])
    return { id: giftId, compradoPor: newComprado }
  }

  await ensureLocalDb()
  const raw = await fs.promises.readFile(LOCAL_DB, "utf-8")
  const arr = JSON.parse(raw)
  const idx = arr.findIndex((g: any) => g.id === giftId)
  if (idx >= 0) {
    const g = arr[idx]
    g.compradoPor = g.compradoPor ? { ...g.compradoPor, recebidoConfirmado: received } : null
    arr[idx] = g
    await fs.promises.writeFile(LOCAL_DB, JSON.stringify(arr, null, 2), "utf-8")
    return arr[idx]
  }
  return null
}

export async function replaceAllGifts(gifts: any[]) {
  if (isPostgres()) {
    const pool = await getPgPool()
    // simple approach: delete and re-insert
    await pool.query("TRUNCATE TABLE gifts")
    const insertQuery = `INSERT INTO gifts(id, nome, categoria, precoEstimado, faixaPreco, imageUrl, ativo, status, compradoPor) VALUES `
    const chunks: string[] = []
    const values: any[] = []
    gifts.forEach((gift, i) => {
      const idx = i * 9
      chunks.push(`($${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6},$${idx + 7},$${idx + 8},$${idx + 9})`)
      values.push(
        gift.id,
        gift.nome,
        gift.categoria,
        gift.precoEstimado,
        gift.faixaPreco,
        gift.imageUrl,
        gift.ativo,
        gift.status,
        gift.compradoPor ? JSON.stringify(gift.compradoPor) : null,
      )
    })
    if (chunks.length === 0) return []
    await pool.query(insertQuery + chunks.join(","), values)
    return gifts
  }

  await ensureLocalDb()
  await fs.promises.writeFile(LOCAL_DB, JSON.stringify(gifts, null, 2), "utf-8")
  return gifts
}
