/**
 * FadeInSection – Animación scroll-triggered SIN framer-motion.
 *
 * Usa CSS transitions + IntersectionObserver nativo del browser.
 * Peso añadido al bundle: ~0 KB (solo unas líneas de JS).
 *
 * Idéntica API a la versión anterior con framer-motion.
 *
 * @example
 * <FadeInSection direction="up" delay={0.1}>
 *   <MiSeccion />
 * </FadeInSection>
 */
'use client';

import { useEffect, useRef } from 'react';

export interface FadeInSectionProps {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
}

export default function FadeInSection({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className,
}: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  const translateHidden =
    direction === 'up'    ? 'translateY(20px)'  :
    direction === 'left'  ? 'translateX(-30px)' :
    direction === 'right' ? 'translateX(30px)'  : 'none';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          observer.disconnect();
        }
      },
      { rootMargin: '-50px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: translateHidden,
        transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
