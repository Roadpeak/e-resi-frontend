'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SmoothScroll } from '../components/layout/SmoothScroll';
import { PageTransition } from '../components/layout/PageTransition';
import { useAuthStore } from '../lib/stores/auth.store';

function AuthHydrator() {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      <SmoothScroll>
        <PageTransition>
          {children}
        </PageTransition>
      </SmoothScroll>
    </QueryClientProvider>
  );
}
