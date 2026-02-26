/**
 * JsonLd – Inyecta Schema.org structured data en el <head>.
 *
 * Uso: <JsonLd schema={objeto} />
 * Se puede usar múltiples veces en la misma página para distintos schemas.
 * No afecta rendimiento (script sin ejecución JS en cliente).
 */

interface JsonLdProps {
  schema: Record<string, unknown>;
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
