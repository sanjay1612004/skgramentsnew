import type { Metadata } from 'next';
import { Suspense } from 'react';
import ExclusiveStore from '@/components/exclusive-store/exclusive-store';
import ExclusiveSkeleton from '@/components/exclusive-store/exclusive-skeleton';
import '@/components/exclusive-store/exclusive-store.css';

export const metadata: Metadata = {
  title: 'Exclusive Store',
  description: 'Sign in to discover THE SK APPARELS customer collections.',
  alternates: { canonical: '/exclusive-store/' },
  robots: { index: false, follow: false },
};

export default function ExclusiveStorePage() {
  return <Suspense fallback={<main id="main" className="ss-page"><ExclusiveSkeleton variant="opening" /></main>}><ExclusiveStore /></Suspense>;
}
