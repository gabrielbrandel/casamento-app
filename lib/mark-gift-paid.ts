import { Pool } from 'pg'

export async function markGiftAsPaid(giftId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

    if (!dbUrl) {
      console.error('POSTGRES_URL ou DATABASE_URL não configurada')
      return { success: false, error: 'Banco de dados não configurado' }
    }

    // Configuração para aceitar certificados SSL auto-assinados (desenvolvimento)
    const pool = new Pool({ 
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false }
    })
    
    try {
      const result = await pool.query(
        `UPDATE gifts 
         SET status = 'comprado', updated_at = NOW()
         WHERE id = $1
         RETURNING id, nome, status`,
        [giftId]
      )

      if (!result.rows || result.rows.length === 0) {
        return { success: false, error: 'Presente não encontrado' }
      }

      console.log(`✅ Presente ${giftId} marcado como comprado:`, result.rows[0])
      return { success: true }
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('❌ Erro ao marcar presente como pago:', error)
    return { success: false, error: String(error) }
  }
}
