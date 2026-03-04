'use client';
/**
 * EnviarRndcButton — Acción para registrar una remesa en el RNDC (procesoid 3).
 *
 * Solo visible cuando estadoRndc === 'PENDIENTE'.
 * Llama a POST /api/remesas/[id]/enviar-rndc y refresca la página en éxito.
 *
 * Flujo completo al hacer clic:
 *   1. Frontend → POST /api/remesas/[id]/enviar-rndc
 *   2. API Route → remesaService.enviarRndc(id)
 *   3. Service   → marca ENVIADA (idempotencia) → buildXmlRemesa → llamarRndc()
 *   4. rndcClient → SOAP ISO-8859-1 → POST a RNDC Ministerio de Transporte
 *   5. RNDC responde → extrae <ingresoid> → marca REGISTRADA + numeroRemesaRndc
 *   6. SyncRndc append-only (auditoría)
 *   7. Respuesta: { data: { numeroRemesaRndc, syncRndcId } }
 *
 * Errores RNDC devuelven HTTP 502: { error: 'RNDC_ERROR', message, syncRndcId }
 *
 * @module EnviarRndcButton
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme/colors';

interface Props {
  remesaId: string;
  numeroRemesa: string;
}

type Estado = 'idle' | 'loading' | 'ok' | 'error';

export function EnviarRndcButton({ remesaId, numeroRemesa }: Props) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('idle');
  const [numRndc, setNumRndc] = useState<string | null>(null);
  const [syncId, setSyncId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleEnviar() {
    if (estado === 'loading') return;
    setEstado('loading');
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/remesas/${remesaId}/enviar-rndc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();

      if (!res.ok) {
        // HTTP 502 — error del RNDC (ingresoid=0 o error de red)
        setErrorMsg(json.message ?? json.error ?? 'El ministerio rechazó la remesa');
        setSyncId(json.syncRndcId ?? null);
        setEstado('error');
        return;
      }

      // Respuesta exitosa: { data: { numeroRemesaRndc, syncRndcId } }
      const data = json.data ?? json;
      setNumRndc(data.numeroRemesaRndc ?? data.ingresoid ?? null);
      setSyncId(data.syncRndcId ?? null);
      setEstado('ok');
      router.refresh();
    } catch (e) {
      setErrorMsg((e as Error).message ?? 'Error de conexión');
      setEstado('error');
    }
  }

  /* ── éxito ── */
  if (estado === 'ok') {
    return (
      <div style={{
        background: colors.primaryBg,
        border: `1px solid ${colors.successBadgeBorder}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        marginTop: 20,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark, margin: 0 }}>
            Remesa registrada en el RNDC
          </p>
          {numRndc && (
            <p style={{ fontSize: 13, color: colors.primaryHover, margin: '4px 0 0', fontFamily: 'monospace' }}>
              No. RNDC: <strong>{numRndc}</strong>
            </p>
          )}
          <p style={{ fontSize: 12, color: colors.textMuted, margin: '2px 0 0' }}>
            La página se actualizará con el nuevo estado.
            {syncId && ` Audit ID: ${syncId}`}
          </p>
        </div>
      </div>
    );
  }

  /* ── error ── */
  const errorBlock = estado === 'error' && errorMsg && (
    <div style={{
      background: colors.errorBg,
      border: `1px solid ${colors.errorBorder}`,
      borderRadius: 8,
      padding: '10px 14px',
      marginTop: 10,
    }}>
      <p style={{ fontSize: 13, color: colors.errorDark, margin: 0, fontWeight: 600 }}>
        ❌ El RNDC rechazó la solicitud
      </p>
      <p style={{ fontSize: 12, color: colors.errorDark, margin: '4px 0 0', fontFamily: 'monospace', wordBreak: 'break-word' }}>
        {errorMsg}
      </p>
      {syncId && (
        <p style={{ fontSize: 11, color: colors.textMuted, margin: '4px 0 0' }}>
          Audit ID: {syncId} — contacta soporte si el problema persiste.
        </p>
      )}
    </div>
  );

  /* ── idle / loading ── */
  return (
    <div style={{
      background: colors.warningBg2,
      border: `1px solid ${colors.warningBorder}`,
      borderRadius: 12,
      padding: '16px 20px',
      marginTop: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.warningDark, margin: 0 }}>
            Pendiente de registro en RNDC
          </p>
          <p style={{ fontSize: 13, color: colors.warningDark, margin: '4px 0 12px', opacity: 0.85 }}>
            La remesa <strong>{numeroRemesa}</strong> existe en CargoClick pero aún no ha sido reportada
            al Ministerio de Transporte. Debe registrarse antes de asignarla a un manifiesto.
          </p>

          <button
            onClick={handleEnviar}
            disabled={estado === 'loading'}
            style={{
              background: estado === 'loading' ? colors.disabledBtn : colors.primary,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '9px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: estado === 'loading' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {estado === 'loading'
              ? <>⏳ Enviando al RNDC…</>
              : <>🚀 Registrar en el RNDC</>}
          </button>

          {estado === 'loading' && (
            <p style={{ fontSize: 12, color: colors.textMuted, margin: '8px 0 0' }}>
              Conectando con el Ministerio de Transporte… esto puede tardar hasta 30 s.
            </p>
          )}
        </div>
      </div>

      {errorBlock}
    </div>
  );
}
