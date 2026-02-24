/**
 * RootPage – Redirige la raíz `/` a `/home`.
 */
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
}
