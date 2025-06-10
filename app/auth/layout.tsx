'use client';

import { Header } from '@/components/ui/header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}