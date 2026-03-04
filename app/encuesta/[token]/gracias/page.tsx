/**
 * app/encuesta/[token]/gracias/page.tsx
 *
 * Página de agradecimiento post-envío de encuesta.
 * Pública — no requiere autenticación.
 *
 * @module EncuestaGraciasPage
 */
export default function GraciasPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🎉</div>

        <h1 className="text-xl font-semibold">¡Muchas gracias!</h1>

        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Tu calificación ha sido registrada.
          <br />
          Nos ayuda a seguir mejorando el servicio.
        </p>

        <p className="mt-8 text-3xl" aria-hidden="true">🚛</p>
      </div>
    </div>
  );
}
