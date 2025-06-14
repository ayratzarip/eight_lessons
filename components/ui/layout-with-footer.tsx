'use client';

import { ReactNode } from 'react';
import { Header } from './header';

export function LayoutWithFooter({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}