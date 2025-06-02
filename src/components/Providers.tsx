'use client';

import { SessionProvider } from 'next-auth/react';
import { PWAProvider } from '@/contexts/PWAContext';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <PWAProvider>
        {children}
      </PWAProvider>
    </SessionProvider>
  );
}
