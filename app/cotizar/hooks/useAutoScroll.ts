/**
 * useAutoScroll - Hook para scroll automático al último elemento
 * 
 * Maneja el scroll automático cuando se agregan nuevos elementos a una lista.
 * Útil para chats, logs, y listas que crecen dinámicamente.
 * 
 * UX: Scroll suave (behavior: 'smooth') para transición natural
 * Performance: Solo ejecuta cuando cambia la dependencia
 * 
 * @param dependency - Valor que al cambiar dispara el scroll (ej: array.length)
 * @returns ref - Ref para asignar al contenedor scrolleable
 * 
 * @example
 * ```tsx
 * function ChatComponent({ messages }) {
 *   const scrollRef = useAutoScroll(messages.length);
 *   
 *   return (
 *     <div ref={scrollRef} className="overflow-y-auto">
 *       {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';

export function useAutoScroll(dependency: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [dependency]);

  return scrollRef;
}
