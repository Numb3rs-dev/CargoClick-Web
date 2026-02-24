/**
 * Layout de /cotizar
 *
 * Layout minimal — ThemeRegistry (MUI + dayjs) vive dentro de ConversacionLazy
 * para que no forme parte del grafo de compilación de este layout server component.
 * Así el primer RSC request de /cotizar es rápido y no arrastra todos los chunks de MUI.
 */
export default function CotizarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
