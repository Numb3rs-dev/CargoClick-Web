'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EncuestaEstrellas } from './EncuestaEstrellas';
import { colors } from '@/lib/theme/colors';

interface Props {
  token: string;
}

/**
 * Formulario público de encuesta post-entrega.
 */
export function EncuestaForm({ token }: Props) {
  const router = useRouter();

  const [puntuacion,  setPuntuacion]  = useState<number | null>(null);
  const [comentarios, setComentarios] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puntuacion) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/encuestas/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calificacionGeneral: puntuacion,
          comentario: comentarios.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (res.status === 409) { router.push(`/encuesta/${token}/gracias`); return; }
      if (!res.ok) throw new Error(json.message ?? 'Error al enviar la calificación');
      router.push(`/encuesta/${token}/gracias`);
    } catch (err) { setError((err as Error).message); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Rating de estrellas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', display: 'block', color: colors.textDefault }}>
          Calificación *
        </label>
        <EncuestaEstrellas value={puntuacion} onChange={setPuntuacion} />
        {puntuacion === null && (
          <p style={{ fontSize: 12, color: colors.textPlaceholder, textAlign: 'center' }}>
            Haz clic en las estrellas para calificar
          </p>
        )}
      </div>

      {/* Comentarios opcionales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="comentarios" style={{ fontSize: 14, fontWeight: 500, color: colors.textDefault }}>
          Comentarios (opcional)
        </label>
        <textarea
          id="comentarios"
          value={comentarios}
          onChange={e => setComentarios(e.target.value)}
          placeholder="¿Qué podemos mejorar?"
          rows={3}
          maxLength={1000}
          style={{
            width: '100%', border: `1px solid ${colors.border}`, borderRadius: 8,
            padding: '8px 12px', fontSize: 14, boxSizing: 'border-box',
            outline: 'none', resize: 'vertical', background: colors.bgWhite,
          }}
        />
        {comentarios.length > 0 && (
          <p style={{ fontSize: 12, color: colors.textPlaceholder, textAlign: 'right' }}>
            {comentarios.length}/1000
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: colors.errorDark, textAlign: 'center' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!puntuacion || submitting}
        style={{
          width: '100%', padding: '11px 22px', fontSize: 15, fontWeight: 600,
          border: 'none', borderRadius: 10,
          background: (!puntuacion || submitting) ? colors.disabledBtn : colors.primary,
          color: colors.bgWhite, cursor: (!puntuacion || submitting) ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Enviando...' : 'Enviar calificación'}
      </button>
    </form>
  );
}
