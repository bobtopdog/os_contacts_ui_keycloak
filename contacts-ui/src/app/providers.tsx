"use client";
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create once to preserve cache across HMR in dev
  const [client] = useState(() => new QueryClient());
  return (
    <SessionProvider>
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
    </SessionProvider>
  );
}