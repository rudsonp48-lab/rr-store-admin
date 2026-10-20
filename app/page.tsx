'use client';

import dynamic from 'next/dynamic';

// Firebase Auth/Storage só rodam no navegador.
const AdminApp = dynamic(() => import('../components/AdminApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-dvh flex items-center justify-center text-neutral-400 text-sm">
      Carregando painel…
    </div>
  ),
});

export default function Page() {
  return <AdminApp />;
}
