import Header from '@/components/layout/Header';
import { OperacionalNav } from '@/components/operacional/layout/OperacionalNav';
import { ReactNode } from 'react';

export default function OperacionalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <OperacionalNav />
      <main style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60 }}>
        {children}
      </main>
    </>
  );
}
