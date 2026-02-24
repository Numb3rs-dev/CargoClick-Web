/**
 * Not Found para /solicitudes/[id]
 * Se muestra cuando el ID no existe en la base de datos
 */

import Link from 'next/link'

export default function SolicitudNotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#F3F4F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 480,
        textAlign: 'center',
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '48px 40px',
        border: '1px solid #E5E7EB',
      }}>
        <p style={{ margin: '0 0 16px', fontSize: 56 }}>🔍</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#111827' }}>
          Solicitud no encontrada
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>
          El ID que buscas no existe o fue eliminado.
          Verifica el enlace o vuelve al inicio.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            background: '#065F46',
            color: '#FFFFFF',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
