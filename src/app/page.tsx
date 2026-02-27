'use client';

import { TabShell } from '@/components/layout/TabShell';

export default function Home() {
  return (
    <main className="min-h-screen court-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TabShell />
      </div>
    </main>
  );
}
