'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminDebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Erro ao fazer seed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckDb = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/db-check')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckGifts = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/gifts')
      const data = await res.json()
      setResult({
        count: Array.isArray(data) ? data.length : 0,
        data: data,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Debug do Banco de Dados</h1>

        <div className="space-y-4 mb-8">
          <Button onClick={handleCheckDb} disabled={loading} className="w-full">
            {loading ? 'Verificando...' : 'Verificar Conexão do Banco'}
          </Button>
          <Button onClick={handleCheckGifts} disabled={loading} className="w-full">
            {loading ? 'Carregando...' : 'Verificar Presentes (GET /api/gifts)'}
          </Button>
          <Button onClick={handleSeed} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? 'Populando...' : 'Popular Banco com Dados Iniciais (SEED)'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 rounded text-red-700 mb-4">
            <p className="font-bold">Erro:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="font-bold mb-2">Resultado:</p>
            <pre className="bg-white p-4 rounded text-sm overflow-auto max-h-96 border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
