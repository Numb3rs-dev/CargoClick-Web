'use client'

/**
 * Buscador en tiempo real para la tabla de cotizaciones.
 * Componente cliente que actualiza el parámetro `q` en la URL con debounce.
 * Al buscar, reinicia la paginación a la página 1.
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { colors } from '@/lib/theme/colors'

interface Props {
  /** Valor inicial leído del searchParam `q` para evitar parpadeo */
  initialValue: string
}

export function BuscadorCotizaciones({ initialValue }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) {
        params.set('q', q.trim())
      } else {
        params.delete('q')
      }
      params.set('page', '1')
      router.push(`/cotizaciones?${params.toString()}`)
    },
    [router, searchParams],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => push(v), 400)
  }

  const handleClear = () => {
    setValue('')
    push('')
  }

  // Sync si el usuario navega hacia atrás/adelante
  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        fontSize: 15, color: colors.textPlaceholder, pointerEvents: 'none',
      }}>
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Empresa, contacto, teléfono, ruta…"
        style={{
          paddingLeft: 36, paddingRight: value ? 32 : 14, paddingTop: 9, paddingBottom: 9,
          border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14,
          width: 300, background: colors.bgWhite, color: colors.textPrimary,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          outline: 'none',
        }}
      />
      {value && (
        <button
          onClick={handleClear}
          title="Limpiar búsqueda"
          style={{
            position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: colors.textPlaceholder, lineHeight: 1, padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
