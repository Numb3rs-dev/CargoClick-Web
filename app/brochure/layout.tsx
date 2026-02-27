import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brochure – CargoClick',
  robots: { index: false, follow: false },
};

export default function BrochureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
