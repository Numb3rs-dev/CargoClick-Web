/**
 * app/encuesta/[token]/page.tsx
 *
 * Página PÚBLICA de encuesta post-entrega.
 * ⚠️ No requiere autenticación Clerk — accesible via link único enviado al cliente.
 * El middleware.ts tiene esta ruta en publicRoutes.
 *
 * @module EncuestaPage
 */
import { notFound } from 'next/navigation';
import { EncuestaForm } from '@/components/operacional/encuesta/EncuestaForm';

interface Props {
  params: Promise<{ token: string }>;
}

/** Obtiene los datos públicos de la encuesta desde la API interna */
async function getEncuesta(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(
    `${baseUrl}/api/encuestas/${token}`,
    { cache: 'no-store' } // siempre fresco — el estado puede cambiar
  );
  if (res.status === 404) return null;
  if (res.status === 409) return { yaRespondida: true, negocioCode: '', clienteNombre: null };
  if (!res.ok) return null;
  const { data } = await res.json();
  return { ...data, yaRespondida: false };
}

export default async function EncuestaPage({ params }: Props) {
  const { token } = await params;
  const encuesta  = await getEncuesta(token);

  // Token inexistente o inválido
  if (!encuesta) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: '#111827' }}>Enlace no válido</p>
          <p style={{ color: '#6B7280', marginTop: 8, fontSize: 13 }}>
            Este link de encuesta no existe o ya expiró.
          </p>
        </div>
      </div>
    );
  }

  // Encuesta ya respondida → redirigir a la pantalla de gracias
  if (encuesta.yaRespondida) {
    const { redirect } = await import('next/navigation');
    redirect(`/encuesta/${token}/gracias`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', padding: 32, maxWidth: 420, width: '100%' }}>

        {/* Logo / Marca */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#111827' }}>CargoClick</p>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, textAlign: 'center', color: '#111827' }}>
          ¿Cómo fue tu experiencia?
        </h1>

        <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          {encuesta.clienteNombre
            ? `Hola${encuesta.clienteNombre ? `, ${encuesta.clienteNombre}` : ''}. `
            : ''}
          Tu envío{' '}
          <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{encuesta.negocioCode}</span>{' '}
          fue entregado. Nos gustaría escuchar tu opinión.
        </p>

        <EncuestaForm token={token} />
      </div>
    </div>
  );
}
