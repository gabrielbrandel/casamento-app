import { NextResponse } from "next/server"
import { getAllGifts, getDbUrl, getDbUrlSource } from "@/lib/server-db"

// Disable TLS verification for Supabase
if (process.env.POSTGRES_URL?.includes("supabase")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

export const runtime = "nodejs"

export async function GET() {
  try {
    const dbUrl = getDbUrl()
    const dbSource = getDbUrlSource()
    const isConfigured = Boolean(dbUrl)

    // Check database details
    let dbInfo = {
      configured: isConfigured,
      source: dbSource || "none",
      tableExists: false,
      rowCount: 0,
      error: null as string | null,
    }

    if (isConfigured) {
      try {
        const { Pool } = await import("pg")
        let connString = dbUrl
        
        let pool = new Pool({
          connectionString: connString,
          connectionTimeoutMillis: 10000,
          ssl: {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined,
          },
        })

        try {
          // Test connection
          await pool.query("SELECT 1")
        } catch (err) {
          console.error("SSL connection failed, retrying without SSL")
          await pool.end()
          
          // Retry without SSL
          connString = connString.replace("?sslmode=require", "").replace("&sslmode=require", "")
          pool = new Pool({
            connectionString: connString,
            connectionTimeoutMillis: 10000,
            ssl: false,
          })
        }

        // Check if table exists
        const tableRes = await pool.query(
          "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'gifts')"
        )
        dbInfo.tableExists = tableRes.rows[0].exists

        // Get row count
        const countRes = await pool.query("SELECT COUNT(*) as count FROM gifts")
        dbInfo.rowCount = parseInt(countRes.rows[0].count, 10)

        await pool.end()
      } catch (err) {
        dbInfo.error = err instanceof Error ? err.message : String(err)
      }
    }

    // Get gifts from API
    const gifts = await getAllGifts()

    return NextResponse.json({
      ok: true,
      database: dbInfo,
      gifts: {
        count: gifts.length,
        items: gifts.slice(0, 2), // Show first 2 as sample
      },
      nextSteps:
        dbInfo.rowCount === 0
          ? "⚠️ Banco está vazio. Execute POST /api/seed para popular com dados iniciais"
          : "✅ Banco tem dados",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
