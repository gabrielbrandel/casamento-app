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

export function getDbUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    ""
  )
}

export function getDbUrlSource() {
  if (process.env.POSTGRES_URL) return "POSTGRES_URL"
  if (process.env.POSTGRES_PRISMA_URL) return "POSTGRES_PRISMA_URL"
  if (process.env.POSTGRES_URL_NON_POOLING) return "POSTGRES_URL_NON_POOLING"
  if (process.env.DATABASE_URL) return "DATABASE_URL"
  return ""
}

function isPostgres() {
  return Boolean(getDbUrl())
}

let pgPool: any = null
async function getPgPool() {
  if (!pgPool) {
    try {
      const { Pool } = await import("pg")
      const connectionString = getDbUrl()
      
      if (!connectionString) {
        console.error('No database connection string found in environment variables')
        throw new Error('POSTGRES_URL not configured')
      }
      
      // Configure SSL - Supabase requires SSL but may have self-signed certificates
      let sslConfig: any = false
      if (connectionString.includes('sslmode=require') || connectionString.includes('supabase')) {
        sslConfig = {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined, // Disable hostname verification
        }
      }
      
      pgPool = new Pool({
        connectionString,
        max: 5,
        connectionTimeoutMillis: 20000,
        idleTimeoutMillis: 30000,
        ssl: sslConfig,
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
    } catch (error) {
      console.error('Error initializing database pool:', error)
      pgPool = null
      throw error
    }
  }
  return pgPool
}

function normalizeGift(row: any): any {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    precoEstimado: row.precoestimado || row.precoEstimado,
    faixaPreco: row.faixapreco || row.faixaPreco,
    imageUrl: row.imageurl || row.imageUrl,
    ativo: row.ativo,
    status: row.status,
    compradoPor: row.compradopor || row.compradoPor || null,
  }
}

export async function getAllGifts() {
  try {
    if (isPostgres()) {
      const pool = await getPgPool()
      const res = await pool.query("SELECT * FROM gifts ORDER BY nome")
      return res.rows.map((r: any) => normalizeGift(r))
    }

    await ensureLocalDb()
    const raw = await fs.promises.readFile(LOCAL_DB, "utf-8")
    return JSON.parse(raw)
  } catch (error) {
    console.error('Error in getAllGifts:', error)
    return []
  }
}

export async function upsertGift(gift: any) {
  if (isPostgres()) {
    const pool = await getPgPool()
    
    // Fetch current gift if exists
    const existing = await pool.query("SELECT * FROM gifts WHERE id = $1", [gift.id])
    const current = existing.rows[0] ? normalizeGift(existing.rows[0]) : null
    
    // Merge with existing data (partial updates)
    const merged = {
      id: gift.id,
      nome: gift.nome !== undefined ? gift.nome : current?.nome,
      categoria: gift.categoria !== undefined ? gift.categoria : current?.categoria,
      precoEstimado: gift.precoEstimado !== undefined ? gift.precoEstimado : current?.precoEstimado,
      faixaPreco: gift.faixaPreco !== undefined ? gift.faixaPreco : current?.faixaPreco,
      imageUrl: gift.imageUrl !== undefined ? gift.imageUrl : current?.imageUrl,
      ativo: gift.ativo !== undefined ? gift.ativo : current?.ativo,
      status: gift.status !== undefined ? gift.status : current?.status,
      compradoPor: gift.compradoPor !== undefined ? gift.compradoPor : current?.compradoPor,
    }
    
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
      merged.id,
      merged.nome,
      merged.categoria,
      merged.precoEstimado,
      merged.faixaPreco,
      merged.imageUrl,
      merged.ativo,
      merged.status,
      merged.compradoPor ? JSON.stringify(merged.compradoPor) : null,
    ])
    return merged
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
  return arr[idx >= 0 ? idx : arr.length - 1]
}

export async function markReceived(giftId: string, received: boolean) {
  if (isPostgres()) {
    const pool = await getPgPool()
    const res = await pool.query("SELECT compradoPor FROM gifts WHERE id = $1", [giftId])
    const comprado = res.rows[0]?.compradopor || res.rows[0]?.compradoPor || null
    const newComprado = comprado ? { ...comprado, recebidoConfirmado: received } : null
    await pool.query("UPDATE gifts SET compradoPor = $1 WHERE id = $2", [newComprado ? JSON.stringify(newComprado) : null, giftId])
    const updated = await pool.query("SELECT * FROM gifts WHERE id = $1", [giftId])
    return normalizeGift(updated.rows[0])
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
