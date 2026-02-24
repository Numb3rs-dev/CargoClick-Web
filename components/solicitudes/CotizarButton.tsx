'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CotizarButton({ solicitudId }: { solicitudId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCotizar = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}/cotizar`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? `Error ${res.status}`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar cotización')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={handleCotizar}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 28px', background: loading ? '#9CA3AF' : '#1D4ED8',
          color: '#FFFFFF', borderRadius: 8, fontWeight: 700, fontSize: 14,
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {loading ? '⏳ Calculando...' : '⚡ Generar cotización SISETAC'}
      </button>
      {error && (
        <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>{error}</p>
      )}
    </div>
  )
}
