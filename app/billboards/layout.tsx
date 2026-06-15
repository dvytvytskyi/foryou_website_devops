import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billboard Analytics MVP',
  description: 'Data-driven billboard management',
};

export default function BillboardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
